import json
import os
import re

from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def generate_cover_letter(
    resume_text: str,
    job_title: str = "",
    company_name: str = "",
    job_description: str = "",
    tone: str = "professional",
) -> dict:
    jt = job_title if job_title else "the position"
    company = company_name if company_name else "your company"
    jd = job_description[:1000] if job_description else "Not provided"

    prompt = (
        "You are an expert cover letter writer. "
        "Write a compelling, personalized cover letter.\n\n"
        f"Job Title: {jt}\n"
        f"Company: {company}\n"
        f"Tone: {tone}\n"
        f"Job Description: {jd}\n\n"
        f"Resume:\n{resume_text[:2000]}\n\n"
        "Return ONLY valid JSON with NO line breaks inside string values. "
        "Use \\n for newlines inside strings:\n"
        "{\n"
        '    "subject_line": "",\n'
        '    "cover_letter": "",\n'
        '    "key_points_highlighted": [],\n'
        '    "personalization_tips": []\n'
        "}\n\n"
        "Rules:\n"
        "- cover_letter: full cover letter (3-4 paragraphs)\n"
        "- subject_line: email subject line\n"
        "- key_points_highlighted: emphasized points\n"
        "- personalization_tips: how to customize"
        "IMPORTANT: The entire response must be valid JSON. "
        "Do NOT use actual newlines inside JSON string values."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert cover letter writer. "
                    "Always respond with valid JSON only. "
                    "Never use raw newlines in JSON — use \\n instead."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=1500,
    )

    result = response.choices[0].message.content.strip()

    # Step 1: Markdown fence সরাও
    result = re.sub(r"^```(?:json)?\s*", "", result)
    result = re.sub(r"\s*```$", "", result)
    result = result.strip()

    # Step 2: JSON block extract করো (safety net)
    match = re.search(r"\{.*\}", result, re.DOTALL)
    if match:
        result = match.group(0)

    # Step 3: String value-এর ভেতরে raw control characters fix করো
    def fix_control_chars(json_str: str) -> str:
        fixed = []
        inside_string = False
        escape_next = False

        for char in json_str:
            if escape_next:
                fixed.append(char)
                escape_next = False
                continue

            if char == "\\":
                fixed.append(char)
                escape_next = True
                continue

            if char == '"':
                inside_string = not inside_string
                fixed.append(char)
                continue

            if inside_string:
                if char == "\n":
                    fixed.append("\\n")
                elif char == "\r":
                    fixed.append("\\r")
                elif char == "\t":
                    fixed.append("\\t")
                else:
                    fixed.append(char)
            else:
                fixed.append(char)

        return "".join(fixed)

    result = fix_control_chars(result)

    return json.loads(result)
