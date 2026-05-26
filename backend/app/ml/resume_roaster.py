import json
import os

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def roast_resume(resume_text: str) -> dict:
    prompt = (
        "You are a savage but helpful resume roaster. "
        "Roast this resume with humor and wit, but also provide "
        "genuinely useful feedback. Be funny but not mean-spirited.\n\n"
        f"Resume:\n{resume_text[:2000]}\n\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '    "roast_title": "",\n'
        '    "roast_lines": [],\n'
        '    "savage_score": 0,\n'
        '    "verdict": "",\n'
        '    "serious_fixes": [],\n'
        '    "one_liner": ""\n'
        "}\n\n"
        "Rules:\n"
        "- roast_title: funny title for the resume (e.g. The Mystery Applicant)\n"
        "- roast_lines: 5 funny but true observations about the resume\n"
        "- savage_score: 1-10 (10 = needs most work)\n"
        "- verdict: 2-3 sentence funny verdict\n"
        "- serious_fixes: 3 actual improvements needed\n"
        "- one_liner: one killer roast line summarizing everything"
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a witty resume roaster. "
                    "Always respond with valid JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    result = response.choices[0].message.content.strip()
    result = result.replace("```json", "").replace("```", "").strip()
    return json.loads(result)
