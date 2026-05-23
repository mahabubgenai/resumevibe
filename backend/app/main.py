import os
import re
import tempfile

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from app.ml.ats_predictor import ATSPredictor  # noqa: E402
from app.ml.llm_analyzer import LLMResumeAnalyzer  # noqa: E402
from app.utils.parser import ResumeParser, ResumeTextCleaner  # noqa: E402
from app.utils.segmenter import ResumeSectionSegmenter  # noqa: E402
from app.utils.skill_extractor import SkillExtractor  # noqa: E402

app = FastAPI(title="ResumeVibe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser = ResumeParser()
cleaner = ResumeTextCleaner()
segmenter = ResumeSectionSegmenter()
extractor = SkillExtractor()
ats_predictor = ATSPredictor()
llm_analyzer = LLMResumeAnalyzer()


@app.get("/")
def root():
    return {"message": "ResumeVibe API is running 🚀"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed:
        raise HTTPException(400, "Only PDF and DOCX supported")

    suffix = ".pdf" if "pdf" in file.content_type else ".docx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        parsed = parser.parse(tmp_path)
        clean_text = cleaner.clean(parsed["raw_text"])
        sections = segmenter.segment(clean_text)
        section_stats = segmenter.get_section_stats(sections)
        skills = extractor.extract(clean_text)

        return {
            "file_name": parsed["file_name"],
            "word_count": parsed["word_count"],
            "sections": sections,
            "section_stats": section_stats,
            "skills": skills,
            "status": "success",
        }
    finally:
        os.unlink(tmp_path)


def _extract_features(clean_text, section_stats, sections, word_count):
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


def _quality_label(score):
    if score >= 86:
        return "excellent"
    if score >= 71:
        return "good"
    if score >= 41:
        return "average"
    return "poor"


@app.post("/api/resume/score")
async def score_resume(file: UploadFile = File(...)):
    allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed:
        raise HTTPException(400, "Only PDF and DOCX supported")

    suffix = ".pdf" if "pdf" in file.content_type else ".docx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        parsed = parser.parse(tmp_path)
        clean_text = cleaner.clean(parsed["raw_text"])
        sections = segmenter.segment(clean_text)
        section_stats = segmenter.get_section_stats(sections)
        skills = extractor.extract(clean_text)

        features = _extract_features(
            clean_text, section_stats, sections, parsed["word_count"]
        )
        ats_score = ats_predictor.predict(features)
        quality = _quality_label(ats_score)

        improvements = []
        if not section_stats["has_experience"]:
            improvements.append("Add work experience section")
        if not section_stats["has_projects"]:
            improvements.append("Add projects section")
        if not section_stats["has_skills"]:
            improvements.append("Add skills section")
        if features["metric_count"] < 2:
            improvements.append("Add quantified achievements (e.g. 40% increase)")
        if parsed["word_count"] < 300:
            improvements.append("Resume too short, add more details")

        return {
            "file_name": parsed["file_name"],
            "word_count": parsed["word_count"],
            "ats_score": ats_score,
            "quality_label": quality,
            "section_stats": section_stats,
            "skills": skills,
            "improvements": improvements,
            "status": "success",
        }
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if file.content_type not in allowed:
        raise HTTPException(400, "Only PDF and DOCX supported")

    suffix = ".pdf" if "pdf" in file.content_type else ".docx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        parsed = parser.parse(tmp_path)
        clean_text = cleaner.clean(parsed["raw_text"])
        sections = segmenter.segment(clean_text)
        section_stats = segmenter.get_section_stats(sections)

        features = _extract_features(
            clean_text, section_stats, sections, parsed["word_count"]
        )
        ats_score = ats_predictor.predict(features)
        quality = _quality_label(ats_score)

        llm_skills = llm_analyzer.extract_skills(clean_text)
        llm_feedback = llm_analyzer.get_ats_feedback(clean_text, ats_score, quality)

        return {
            "file_name": parsed["file_name"],
            "word_count": parsed["word_count"],
            "ats_score": ats_score,
            "quality_label": quality,
            "section_stats": section_stats,
            "llm_skills": llm_skills,
            "llm_feedback": llm_feedback,
            "status": "success",
        }
    finally:
        os.unlink(tmp_path)
