import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def suggest_career_paths(
    resume_text: str,
    current_title: str = "",
    skills: list = [],
) -> dict:
    skills_str = ", ".join(skills[:15]) if skills else "Not specified"

    prompt = (
        "You are an expert career counselor with deep knowledge of job markets. "
        "Analyze this resume and suggest realistic career paths.\n\n"
        f"Current Job Title: {current_title if current_title else 'Not specified'}\n"
        f"Key Skills: {skills_str}\n\n"
        f"Resume Summary:\n{resume_text[:2000]}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '    "current_level": "",\n'
        '    "current_role_assessment": "",\n'
        '    "career_paths": [\n'
        "        {\n"
        '            "title": "",\n'
        '            "type": "lateral/promotion/pivot",\n'
        '            "timeline": "6 months/1 year/2 years",\n'
        '            "match_percentage": 0,\n'
        '            "required_skills": [],\n'
        '            "skills_you_have": [],\n'
        '            "skills_to_learn": [],\n'
        '            "salary_range": "",\n'
        '            "why_good_fit": "",\n'
        '            "action_steps": []\n'
        "        }\n"
        "    ],\n"
        '    "top_recommendation": "",\n'
        '    "immediate_actions": [],\n'
        '    "learning_resources": [\n'
        "        {\n"
        '            "skill": "",\n'
        '            "resource": "",\n'
        '            "type": "course/certification/project"\n'
        "        }\n"
        "    ]\n"
        "}\n\n"
        "Suggest 3 career paths. Be specific and realistic."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert career counselor. "
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
