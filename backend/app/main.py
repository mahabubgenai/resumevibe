from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.utils.parser import ResumeParser, ResumeTextCleaner
from app.utils.segmenter import ResumeSectionSegmenter
from app.utils.skill_extractor import SkillExtractor
import tempfile
import os

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
