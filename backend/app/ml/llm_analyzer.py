import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SKILL_EXTRACTION_PROMPT = """You are an expert resume analyzer.
Extract structured information from the resume text below.

Return ONLY a valid JSON object with this exact structure:
{{
    "skills": {{
        "technical": [],
        "soft": [],
        "tools": [],
        "languages": []
    }},
    "experience_years": 0,
    "job_titles": [],
    "education_level": "",
    "key_achievements": [],
    "missing_sections": [],
    "improvement_suggestions": []
}}

Resume Text:
{resume_text}"""

ATS_FEEDBACK_PROMPT = """You are an ATS (Applicant Tracking System) expert.
Analyze this resume and provide detailed feedback.

ATS Score: {ats_score}/100
Quality: {quality_label}

Resume Text:
{resume_text}

Return ONLY a valid JSON object:
{{
    "ats_feedback": {{
        "strengths": [],
        "weaknesses": [],
        "keyword_suggestions": [],
        "format_issues": [],
        "overall_assessment": ""
    }},
    "rewrite_suggestions": {{
        "summary": "",
        "skills_to_add": [],
        "action_verbs": []
    }}
}}"""


class LLMResumeAnalyzer:
    def __init__(self):
        self.model = "llama-3.3-70b-versatile"

    def extract_skills(self, resume_text: str) -> dict:
        text = resume_text[:3000]

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a resume analyzer. "
                        "Always respond with valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": SKILL_EXTRACTION_PROMPT.format(resume_text=text),
                },
            ],
            temperature=0.1,
            max_tokens=1000,
        )

        result = response.choices[0].message.content.strip()
        result = result.replace("```json", "").replace("```", "").strip()
        return json.loads(result)

    def get_ats_feedback(
        self,
        resume_text: str,
        ats_score: float,
        quality_label: str,
    ) -> dict:
        text = resume_text[:3000]

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an ATS expert. " "Always respond with valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": ATS_FEEDBACK_PROMPT.format(
                        resume_text=text,
                        ats_score=ats_score,
                        quality_label=quality_label,
                    ),
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )

        result = response.choices[0].message.content.strip()
        result = result.replace("```json", "").replace("```", "").strip()
        return json.loads(result)
