import os
import re
import tempfile
import asyncio  # noqa: E402

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from app.ml.ats_predictor import ATSPredictor  # noqa: E402
from app.ml.llm_analyzer import LLMResumeAnalyzer  # noqa: E402
from app.utils.parser import ResumeParser, ResumeTextCleaner  # noqa: E402
from app.utils.segmenter import ResumeSectionSegmenter  # noqa: E402
from app.utils.skill_extractor import SkillExtractor  # noqa: E402
from app.ml.job_matcher import JobMatcher  # noqa: E402
from app.ml.pipeline import run_pipeline  # noqa: E402
from app.payments.stripe_handler import (  # noqa: E402
    create_checkout_session,
    create_portal_session,
    handle_webhook,
)
from app.db.supabase_client import supabase  # noqa: E402
from fastapi import Request  # noqa: E402
from pydantic import BaseModel  # noqa: E402
from fastapi import WebSocket  # noqa: E402
from app.ml.job_scraper import search_jobs_for_resume  # noqa: E402
from pydantic import BaseModel as PydanticBase  # noqa: E402
from app.ml.rag_pipeline import rag_pipeline  # noqa: E402
from app.utils.pdf_generator import generate_analysis_pdf  # noqa: E402
from fastapi.responses import Response  # noqa: E402
from app.ml.interview_generator import generate_interview_qa  # noqa: E402
from app.ml.career_path import suggest_career_paths  # noqa: E402
from app.ml.resume_roaster import roast_resume  # noqa: E402
from app.ml.resume_rewriter import rewrite_resume  # noqa: E402
from app.ml.skill_roadmap import generate_skill_roadmap  # noqa: E402
from pydantic import BaseModel as RoadmapBase  # noqa: E402


class CheckoutRequest(BaseModel):
    user_id: str
    email: str


class PortalRequest(BaseModel):
    customer_id: str


class JobSearchRequest(PydanticBase):
    job_titles: list
    skills: list
    location: str = "Remote"


class RAGQuestionRequest(BaseModel):
    question: str
    resume_text: str = ""


class RoadmapRequest(RoadmapBase):
    current_skills: list
    target_role: str
    timeline: str = "6 months"


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
job_matcher = JobMatcher()


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


@app.post("/api/resume/match")
async def match_resume(
    resume: UploadFile = File(...),
    job_description: str = "Software Engineer with Python experience",
):
    allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if resume.content_type not in allowed:
        raise HTTPException(400, "Only PDF and DOCX supported")

    suffix = ".pdf" if "pdf" in resume.content_type else ".docx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await resume.read())
        tmp_path = tmp.name

    try:
        parsed = parser.parse(tmp_path)
        clean_text = cleaner.clean(parsed["raw_text"])
        result = job_matcher.match(clean_text, job_description)

        return {
            "file_name": parsed["file_name"],
            **result,
            "status": "success",
        }
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/pipeline")
async def pipeline_analyze(
    file: UploadFile = File(...),
    job_description: str = "",
):
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
        result = run_pipeline(
            tmp_path,
            job_description if job_description.strip() else None,
        )

        if result["status"] == "error":
            raise HTTPException(500, result.get("error", "Pipeline failed"))

        return {
            "file_name": result["file_name"],
            "word_count": result["word_count"],
            "ats_score": result["ats_score"],
            "quality_label": result["quality_label"],
            "improvements": result["improvements"],
            "section_stats": result["section_stats"],
            "skills": result["skills"],
            "llm_skills": result["llm_skills"],
            "llm_feedback": result["llm_feedback"],
            "match_score": result["match_score"],
            "match_level": result["match_level"],
            "status": "success",
        }
    finally:
        os.unlink(tmp_path)


@app.post("/api/payments/checkout")
async def create_checkout(req: CheckoutRequest):
    url = create_checkout_session(req.user_id, req.email)
    return {"url": url}


@app.post("/api/payments/portal")
async def billing_portal(req: PortalRequest):
    url = create_portal_session(req.customer_id)
    return {"url": url}


@app.post("/api/payments/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    result = handle_webhook(payload, sig_header)

    if result.get("event") == "subscription_created":
        supabase.table("subscriptions").upsert(
            {
                "user_id": result["user_id"],
                "stripe_customer_id": result["customer_id"],
                "stripe_subscription_id": result["subscription_id"],
                "plan": "pro",
                "status": "active",
            }
        ).execute()

    if result.get("event") == "subscription_cancelled":
        supabase.table("subscriptions").update(
            {"plan": "free", "status": "cancelled"}
        ).eq("stripe_subscription_id", result["subscription_id"]).execute()

    return {"status": "ok"}


@app.websocket("/ws/analyze")
async def websocket_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        # File info receive করো
        data = await websocket.receive_json()
        file_path = data.get("file_path")
        job_description = data.get("job_description", "")

        if not file_path:
            await websocket.send_json({"error": "No file path provided"})
            return

        # Agent 1: Parse
        await websocket.send_json(
            {
                "step": 1,
                "total": 5,
                "status": "running",
                "message": "📄 Parsing resume...",
            }
        )
        await asyncio.sleep(0.5)
        parsed = parser.parse(file_path)
        clean_text = cleaner.clean(parsed["raw_text"])
        await websocket.send_json(
            {
                "step": 1,
                "total": 5,
                "status": "done",
                "message": f"✅ Parsed ({parsed['word_count']} words)",
            }
        )

        # Agent 2: Sections
        await websocket.send_json(
            {
                "step": 2,
                "total": 5,
                "status": "running",
                "message": "🔍 Extracting sections & skills...",
            }
        )
        await asyncio.sleep(0.3)
        sections = segmenter.segment(clean_text)
        section_stats = segmenter.get_section_stats(sections)
        skills = extractor.extract(clean_text)
        await websocket.send_json(
            {
                "step": 2,
                "total": 5,
                "status": "done",
                "message": f"✅ Found {section_stats['total_sections']} sections",
            }
        )

        # Agent 3: ATS Score
        await websocket.send_json(
            {
                "step": 3,
                "total": 5,
                "status": "running",
                "message": "📊 Calculating ATS score...",
            }
        )
        await asyncio.sleep(0.3)
        features = _extract_features(
            clean_text, section_stats, sections, parsed["word_count"]
        )
        ats_score = ats_predictor.predict(features)
        quality = _quality_label(ats_score)
        await websocket.send_json(
            {
                "step": 3,
                "total": 5,
                "status": "done",
                "message": f"✅ ATS Score: {ats_score} ({quality})",
            }
        )

        # Agent 4: LLM
        await websocket.send_json(
            {
                "step": 4,
                "total": 5,
                "status": "running",
                "message": "🧠 Running LLM analysis (Groq)...",
            }
        )
        llm_skills = llm_analyzer.extract_skills(clean_text)
        llm_feedback = llm_analyzer.get_ats_feedback(clean_text, ats_score, quality)
        await websocket.send_json(
            {
                "step": 4,
                "total": 5,
                "status": "done",
                "message": "✅ LLM analysis complete",
            }
        )

        # Agent 5: Job Match
        await websocket.send_json(
            {
                "step": 5,
                "total": 5,
                "status": "running",
                "message": "🎯 Matching job description...",
            }
        )
        match_score = None
        match_level = None
        if job_description.strip():
            match_result = job_matcher.match(clean_text, job_description)
            match_score = match_result["match_score"]
            match_level = match_result["match_level"]
        await websocket.send_json(
            {
                "step": 5,
                "total": 5,
                "status": "done",
                "message": "✅ Job matching complete",
            }
        )

        # Final result
        improvements = []
        if not section_stats["has_experience"]:
            improvements.append("Add work experience section")
        if not section_stats["has_projects"]:
            improvements.append("Add projects section")
        if features["metric_count"] < 2:
            improvements.append("Add quantified achievements")
        if parsed["word_count"] < 300:
            improvements.append("Resume too short")

        await websocket.send_json(
            {
                "step": 5,
                "total": 5,
                "status": "complete",
                "message": "🎉 Analysis complete!",
                "result": {
                    "file_name": parsed["file_name"],
                    "word_count": parsed["word_count"],
                    "ats_score": ats_score,
                    "quality_label": quality,
                    "improvements": improvements,
                    "section_stats": section_stats,
                    "skills": skills,
                    "llm_skills": llm_skills,
                    "llm_feedback": llm_feedback,
                    "match_score": match_score,
                    "match_level": match_level,
                },
            }
        )

    except Exception as e:
        await websocket.send_json(
            {
                "status": "error",
                "message": f"Error: {str(e)}",
            }
        )
    finally:
        await websocket.close()


@app.post("/api/jobs/search")
async def search_jobs(req: JobSearchRequest):
    result = search_jobs_for_resume(
        req.job_titles,
        req.skills,
        req.location,
    )
    return result


@app.post("/api/rag/ask")
async def ask_rag(req: RAGQuestionRequest):
    answer = rag_pipeline.answer_question(req.question, req.resume_text)
    return {"answer": answer, "status": "success"}


@app.post("/api/rag/tips")
async def get_rag_tips(file: UploadFile = File(...), job_title: str = ""):
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
        tips = rag_pipeline.get_improvement_tips(clean_text, job_title)
        return {"tips": tips, "status": "success"}
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/export-pdf")
async def export_analysis_pdf(file: UploadFile = File(...), job_description: str = ""):
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

        match_score = None
        match_level = None
        if job_description.strip():
            match_result = job_matcher.match(clean_text, job_description)
            match_score = match_result["match_score"]
            match_level = match_result["match_level"]

        analysis_data = {
            "file_name": parsed["file_name"],
            "word_count": parsed["word_count"],
            "ats_score": ats_score,
            "quality_label": quality,
            "section_stats": section_stats,
            "llm_skills": llm_skills,
            "llm_feedback": llm_feedback,
            "match_score": match_score,
            "match_level": match_level,
        }

        pdf_bytes = generate_analysis_pdf(analysis_data)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=resumevibe-analysis.pdf"
            },
        )
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/interview-prep")
async def interview_prep(
    file: UploadFile = File(...),
    job_description: str = "",
    job_title: str = "",
):
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
        result = generate_interview_qa(clean_text, job_description, job_title)
        return {"interview_qa": result, "status": "success"}
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/career-path")
async def career_path(file: UploadFile = File(...)):
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

        llm_skills = llm_analyzer.extract_skills(clean_text)
        job_titles = llm_skills.get("job_titles", [])
        current_title = job_titles[0] if job_titles else ""
        all_skills = llm_skills.get("skills", {}).get("technical", []) + llm_skills.get(
            "skills", {}
        ).get("tools", [])

        result = suggest_career_paths(clean_text, current_title, all_skills)
        return {"career_paths": result, "status": "success"}
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/roast")
async def resume_roast(file: UploadFile = File(...)):
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
        result = roast_resume(clean_text)
        return {"roast": result, "status": "success"}
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/rewrite")
async def resume_rewrite(
    file: UploadFile = File(...),
    job_title: str = "",
    job_description: str = "",
):
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
        result = rewrite_resume(clean_text, job_title, job_description)
        return {"rewrite": result, "status": "success"}
    finally:
        os.unlink(tmp_path)


@app.post("/api/resume/skill-roadmap")
async def skill_roadmap(req: RoadmapRequest):
    result = generate_skill_roadmap(
        req.current_skills,
        req.target_role,
        req.timeline,
    )
    return {"roadmap": result, "status": "success"}
