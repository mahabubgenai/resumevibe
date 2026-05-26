import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def generate_skill_roadmap(
    current_skills: list,
    target_role: str,
    timeline: str = "6 months",
) -> dict:
    skills_str = ", ".join(current_skills[:15]) if current_skills else "Not specified"

    prompt = (
        "You are an expert career coach and skill development advisor. "
        "Create a detailed skill roadmap for someone to reach their target role.\n\n"
        f"Current Skills: {skills_str}\n"
        f"Target Role: {target_role}\n"
        f"Timeline: {timeline}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '    "readiness_score": 0,\n'
        '    "readiness_label": "",\n'
        '    "skills_you_have": [],\n'
        '    "critical_skills_missing": [],\n'
        '    "nice_to_have_skills": [],\n'
        '    "monthly_plan": [\n'
        "        {\n"
        '            "month": "",\n'
        '            "focus": "",\n'
        '            "skills_to_learn": [],\n'
        '            "resources": [],\n'
        '            "milestone": ""\n'
        "        }\n"
        "    ],\n"
        '    "certifications": [],\n'
        '    "projects_to_build": [],\n'
        '    "estimated_salary": ""\n'
        "}\n\n"
        "Rules:\n"
        "- readiness_score: 0-100 (how ready they are now)\n"
        "- monthly_plan: break timeline into months with specific tasks\n"
        "- resources: specific course/platform names\n"
        "- projects_to_build: 2-3 portfolio projects\n"
        "Be specific and realistic."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert career coach. "
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
