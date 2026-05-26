import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def analyze_job_fit(
    resume_text: str,
    job_description: str,
    job_title: str = "",
) -> dict:
    jt = job_title if job_title else "the position"

    prompt = (
        "You are an expert recruiter and ATS specialist. "
        "Analyze how well this resume fits the job description.\n\n"
        f"Job Title: {jt}\n\n"
        f"Job Description:\n{job_description[:2000]}\n\n"
        f"Resume:\n{resume_text[:2000]}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '    "overall_fit_score": 0,\n'
        '    "fit_label": "",\n'
        '    "summary": "",\n'
        '    "matching_keywords": [],\n'
        '    "missing_keywords": [],\n'
        '    "matching_skills": [],\n'
        '    "missing_skills": [],\n'
        '    "experience_match": {\n'
        '        "score": 0,\n'
        '        "comment": ""\n'
        "    },\n"
        '    "education_match": {\n'
        '        "score": 0,\n'
        '        "comment": ""\n'
        "    },\n"
        '    "skills_match": {\n'
        '        "score": 0,\n'
        '        "comment": ""\n'
        "    },\n"
        '    "quick_fixes": [],\n'
        '    "should_apply": true\n'
        "}\n\n"
        "Rules:\n"
        "- overall_fit_score: 0-100\n"
        "- fit_label: Poor/Average/Good/Excellent\n"
        "- quick_fixes: top 3 things to fix before applying\n"
        "- should_apply: boolean recommendation"
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert recruiter. "
                    "Always respond with valid JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1500,
    )

    result = response.choices[0].message.content.strip()
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)
