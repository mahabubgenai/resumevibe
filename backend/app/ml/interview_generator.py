import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def generate_interview_qa(
    resume_text: str,
    job_description: str = "",
    job_title: str = "",
) -> dict:
    jd = job_description[:1000] if job_description else "Not provided"
    jt = job_title if job_title else "Not specified"

    prompt = (
        "You are an expert interview coach. "
        "Based on the resume and job description below, "
        "generate realistic interview questions with ideal answers.\n\n"
        f"Resume:\n{resume_text[:2000]}\n\n"
        f"Job Description:\n{jd}\n\n"
        f"Job Title: {jt}\n\n"
        "Generate interview questions. Return ONLY valid JSON:\n"
        "{\n"
        '    "technical": [\n'
        '        {"question": "", "ideal_answer": "", "difficulty": ""}\n'
        "    ],\n"
        '    "behavioral": [\n'
        '        {"question": "", "ideal_answer": "", "tip": ""}\n'
        "    ],\n"
        '    "situational": [\n'
        '        {"question": "", "ideal_answer": "", "tip": ""}\n'
        "    ],\n"
        '    "about_resume": [\n'
        '        {"question": "", "ideal_answer": ""}\n'
        "    ],\n"
        '    "to_ask_interviewer": [\n'
        '        {"question": "", "why_ask": ""}\n'
        "    ]\n"
        "}\n\n"
        "Generate 3 questions for each category."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert interview coach. "
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
