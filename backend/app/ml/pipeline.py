import re
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

from app.utils.parser import ResumeParser, ResumeTextCleaner
from app.utils.segmenter import ResumeSectionSegmenter
from app.utils.skill_extractor import SkillExtractor
from app.ml.ats_predictor import ATSPredictor
from app.ml.llm_analyzer import LLMResumeAnalyzer
from app.ml.job_matcher import JobMatcher


# ── State Definition ───────────────────────────────────
class ResumeState(TypedDict):
    # Input
    file_path: str
    job_description: Optional[str]

    # Parse Agent
    raw_text: str
    clean_text: str
    word_count: int
    file_name: str

    # Section Agent
    sections: dict
    section_stats: dict

    # Skill Agent
    skills: dict

    # ATS Agent
    ats_score: float
    quality_label: str
    improvements: list

    # LLM Agent
    llm_skills: dict
    llm_feedback: dict

    # Match Agent
    match_score: Optional[float]
    match_level: Optional[str]

    # Final
    status: str
    error: Optional[str]


# ── Helpers ────────────────────────────────────────────
parser = ResumeParser()
cleaner = ResumeTextCleaner()
segmenter = ResumeSectionSegmenter()
extractor = SkillExtractor()
ats_predictor = ATSPredictor()
llm_analyzer = LLMResumeAnalyzer()
job_matcher = JobMatcher()


def get_quality_label(score: float) -> str:
    if score >= 86:
        return "excellent"
    if score >= 71:
        return "good"
    if score >= 41:
        return "average"
    return "poor"


def get_features(clean_text: str, section_stats: dict, sections: dict, word_count: int):
    return {
        "has_education": int(section_stats["has_education"]),
        "has_experience": int(section_stats["has_experience"]),
        "has_skills": int(section_stats["has_skills"]),
        "has_projects": int(section_stats["has_projects"]),
        "has_summary": int("summary" in sections),
        "has_cert": int("certifications" in sections),
        "has_email": int(bool(re.search(r"[\w\.-]+@[\w\.-]+", clean_text))),
        "has_phone": int(
            bool(re.search(r"\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b", clean_text))
        ),
        "metric_count": len(
            re.findall(r"\d+[\%\+]|\$\d+|\d+\s*(?:years?|months?)", clean_text)
        ),
        "word_count": word_count,
    }


# ── Agent 1: Parse ─────────────────────────────────────
def parse_agent(state: ResumeState) -> ResumeState:
    print("🔄 Agent 1: Parsing resume...")
    try:
        parsed = parser.parse(state["file_path"])
        clean_text = cleaner.clean(parsed["raw_text"])
        return {
            **state,
            "raw_text": parsed["raw_text"],
            "clean_text": clean_text,
            "word_count": parsed["word_count"],
            "file_name": parsed["file_name"],
            "status": "parsed",
        }
    except Exception as e:
        return {**state, "status": "error", "error": str(e)}


# ── Agent 2: Section + Skill ───────────────────────────
def section_agent(state: ResumeState) -> ResumeState:
    print("🔄 Agent 2: Extracting sections & skills...")
    try:
        sections = segmenter.segment(state["clean_text"])
        section_stats = segmenter.get_section_stats(sections)
        skills = extractor.extract(state["clean_text"])
        return {
            **state,
            "sections": sections,
            "section_stats": section_stats,
            "skills": skills,
            "status": "sectioned",
        }
    except Exception as e:
        return {**state, "status": "error", "error": str(e)}


# ── Agent 3: ATS Score ─────────────────────────────────
def ats_agent(state: ResumeState) -> ResumeState:
    print("🔄 Agent 3: Calculating ATS score...")
    try:
        features = get_features(
            state["clean_text"],
            state["section_stats"],
            state["sections"],
            state["word_count"],
        )
        ats_score = ats_predictor.predict(features)
        quality = get_quality_label(ats_score)

        improvements = []
        if not state["section_stats"]["has_experience"]:
            improvements.append("Add work experience section")
        if not state["section_stats"]["has_projects"]:
            improvements.append("Add projects section")
        if not state["section_stats"]["has_skills"]:
            improvements.append("Add skills section")
        if features["metric_count"] < 2:
            improvements.append("Add quantified achievements (e.g. 40% increase)")
        if state["word_count"] < 300:
            improvements.append("Resume too short, add more details")

        return {
            **state,
            "ats_score": ats_score,
            "quality_label": quality,
            "improvements": improvements,
            "status": "scored",
        }
    except Exception as e:
        return {**state, "status": "error", "error": str(e)}


# ── Agent 4: LLM Analysis ──────────────────────────────
def llm_agent(state: ResumeState) -> ResumeState:
    print("🔄 Agent 4: Running LLM analysis...")
    try:
        llm_skills = llm_analyzer.extract_skills(state["clean_text"])
        llm_feedback = llm_analyzer.get_ats_feedback(
            state["clean_text"],
            state["ats_score"],
            state["quality_label"],
        )
        return {
            **state,
            "llm_skills": llm_skills,
            "llm_feedback": llm_feedback,
            "status": "analyzed",
        }
    except Exception as e:
        return {**state, "status": "error", "error": str(e)}


# ── Agent 5: Job Match ─────────────────────────────────
def match_agent(state: ResumeState) -> ResumeState:
    print("🔄 Agent 5: Matching with job description...")
    try:
        if state.get("job_description"):
            result = job_matcher.match(
                state["clean_text"],
                state["job_description"],
            )
            return {
                **state,
                "match_score": result["match_score"],
                "match_level": result["match_level"],
                "status": "matched",
            }
        return {**state, "match_score": None, "match_level": None, "status": "matched"}
    except Exception as e:
        return {**state, "status": "error", "error": str(e)}


# ── Conditional Edge ───────────────────────────────────
def should_continue(state: ResumeState) -> str:
    if state["status"] == "error":
        return "end"
    return "continue"


# ── Build Graph ────────────────────────────────────────
def build_pipeline():
    graph = StateGraph(ResumeState)

    # Add nodes
    graph.add_node("parse", parse_agent)
    graph.add_node("section", section_agent)
    graph.add_node("ats", ats_agent)
    graph.add_node("llm", llm_agent)
    graph.add_node("match", match_agent)

    # Entry point
    graph.set_entry_point("parse")

    # Edges with error handling
    graph.add_conditional_edges(
        "parse",
        should_continue,
        {"continue": "section", "end": END},
    )
    graph.add_conditional_edges(
        "section",
        should_continue,
        {"continue": "ats", "end": END},
    )
    graph.add_conditional_edges(
        "ats",
        should_continue,
        {"continue": "llm", "end": END},
    )
    graph.add_conditional_edges(
        "llm",
        should_continue,
        {"continue": "match", "end": END},
    )
    graph.add_edge("match", END)

    return graph.compile()


# ── Pipeline Instance ──────────────────────────────────
resume_pipeline = build_pipeline()


def run_pipeline(file_path: str, job_description: str = None) -> dict:
    initial_state: ResumeState = {
        "file_path": file_path,
        "job_description": job_description,
        "raw_text": "",
        "clean_text": "",
        "word_count": 0,
        "file_name": "",
        "sections": {},
        "section_stats": {},
        "skills": {},
        "ats_score": 0.0,
        "quality_label": "",
        "improvements": [],
        "llm_skills": {},
        "llm_feedback": {},
        "match_score": None,
        "match_level": None,
        "status": "started",
        "error": None,
    }

    result = resume_pipeline.invoke(initial_state)
    return result
