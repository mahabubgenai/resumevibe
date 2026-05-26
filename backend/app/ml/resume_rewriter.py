import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def rewrite_resume(
    resume_text: str,
    job_title: str = "",
    job_description: str = "",
) -> dict:
    jt = job_title if job_title else "Professional"
    jd = job_description[:1000] if job_description else "Not provided"

    prompt = (
        "You are an expert resume writer. "
        "Rewrite this resume to be more professional, ATS-optimized, "
        "and impactful. Use strong action verbs and quantify achievements.\n\n"
        f"Target Job Title: {jt}\n"
        f"Job Description: {jd}\n\n"
        f"Original Resume:\n{resume_text[:3000]}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '    "rewritten_summary": "",\n'
        '    "rewritten_experience": [],\n'
        '    "rewritten_skills": [],\n'
        '    "improvements_made": [],\n'
        '    "ats_keywords_added": [],\n'
        '    "overall_improvement": ""\n'
        "}\n\n"
        "Rules:\n"
        "- rewritten_summary: improved professional summary (3-4 sentences)\n"
        "- rewritten_experience: list of rewritten bullet points\n"
        "- rewritten_skills: categorized skills list\n"
        "- improvements_made: what was improved\n"
        "- ats_keywords_added: keywords added for ATS\n"
        "- overall_improvement: overall assessment"
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert resume writer. "
                    "Always respond with valid JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    result = response.choices[0].message.content.strip()
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)
