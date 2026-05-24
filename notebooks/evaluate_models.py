import os
import sys
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")  # .env load করো
os.chdir(os.path.join(os.path.dirname(__file__), "..", "backend"))

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.ml.ats_predictor import ATSPredictor  # noqa: E402
from backend.app.ml.llm_analyzer import LLMResumeAnalyzer  # noqa: E402
from backend.app.ml.job_matcher import JobMatcher  # noqa: E402

# ── Test Resumes ───────────────────────────────────────
TEST_RESUMES = [
    {
        "id": "software_engineer",
        "text": """
        John Doe | john@email.com | +1-555-123-4567
        SUMMARY
        Software Engineer with 5 years of experience building scalable web applications.
        EXPERIENCE
        Senior Developer - TechCorp (2020-2024)
        - Built REST APIs serving 1M+ daily requests using FastAPI and Python
        - Reduced system latency by 40% through Redis caching implementation
        - Led team of 5 engineers delivering 3 major product releases
        EDUCATION
        BSc Computer Science - MIT (2015-2019) GPA: 3.8
        SKILLS
        Python, FastAPI, React, Docker, PostgreSQL, AWS, Redis
        PROJECTS
        - E-commerce platform with 50,000+ active users
        - Open source CLI tool with 2,000+ GitHub stars
        CERTIFICATIONS
        AWS Solutions Architect, Docker Certified Associate
        """,
        "expected_quality": "good",
    },
    {
        "id": "network_engineer",
        "text": """
        Jane Smith | jane@email.com
        SUMMARY
        Network Engineer with CCNA certification and 2 years experience.
        EXPERIENCE
        IT Support Intern - NetCo (2023-2024)
        - Configured Cisco routers and MikroTik switches for 200+ user network
        - Maintained 99.9% uptime for critical infrastructure
        EDUCATION
        Diploma in Computer Science - Polytechnic Institute (2020-2024)
        SKILLS
        Cisco, MikroTik, OSPF, EIGRP, BGP, VLAN, DNS, DHCP, Firewall
        CERTIFICATIONS
        CCNA, MTCNA
        """,
        "expected_quality": "average",
    },
    {
        "id": "weak_resume",
        "text": """
        Bob | bob@email.com
        Did some programming work.
        Know Python and stuff.
        Went to college.
        """,
        "expected_quality": "poor",
    },
]

TEST_JOB_DESCRIPTIONS = [
    {
        "id": "python_developer",
        "text": "Python Developer with FastAPI, Docker, PostgreSQL experience. "
        "Must know REST APIs and cloud deployment.",
    },
    {
        "id": "network_engineer",
        "text": "Network Engineer with Cisco, MikroTik, OSPF, BGP, VLAN experience. "
        "CCNA required.",
    },
]


def evaluate_ats_predictor():
    print("\n" + "=" * 55)
    print("1. XGBoost ATS Predictor Evaluation")
    print("=" * 55)

    import re

    predictor = ATSPredictor()
    results = []

    for resume in TEST_RESUMES:
        text = resume["text"].lower()

        features = {
            "has_education": int(bool(re.search(r"\beducation\b", text))),
            "has_experience": int(bool(re.search(r"\bexperience\b", text))),
            "has_skills": int(bool(re.search(r"\bskills\b", text))),
            "has_projects": int(bool(re.search(r"\bproject\b", text))),
            "has_summary": int(bool(re.search(r"\bsummary\b", text))),
            "has_cert": int(bool(re.search(r"\bcertif\b", text))),
            "has_email": int(bool(re.search(r"[\w\.-]+@[\w\.-]+", text))),
            "has_phone": int(
                bool(re.search(r"\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b", text))
            ),
            "metric_count": len(
                re.findall(r"\d+[\%\+]|\$\d+|\d+\s*(?:years?|months?)", text)
            ),
            "word_count": len(text.split()),
        }

        score = predictor.predict(features)

        if score >= 86:
            predicted = "excellent"
        elif score >= 71:
            predicted = "good"
        elif score >= 41:
            predicted = "average"
        else:
            predicted = "poor"

        correct = predicted == resume["expected_quality"]
        results.append(
            {
                "resume": resume["id"],
                "ats_score": score,
                "predicted": predicted,
                "expected": resume["expected_quality"],
                "correct": correct,
            }
        )

        status = "✅" if correct else "❌"
        print(
            f"{status} {resume['id']:20} "
            f"Score: {score:5.1f} | "
            f"Predicted: {predicted:10} | "
            f"Expected: {resume['expected_quality']}"
        )

    accuracy = sum(r["correct"] for r in results) / len(results) * 100
    print(
        f"Accuracy: {accuracy:.0f}% "
        f"({sum(r['correct'] for r in results)}/{len(results)})"
    )
    return results


def evaluate_job_matcher():
    print("\n" + "=" * 55)
    print("2. Job-Resume Match Evaluation")
    print("=" * 55)

    matcher = JobMatcher()
    results = []

    pairs = [
        ("software_engineer", "python_developer", "high"),
        ("network_engineer", "network_engineer", "high"),
        ("weak_resume", "python_developer", "low"),
    ]

    for resume_id, job_id, expected in pairs:
        resume = next(r for r in TEST_RESUMES if r["id"] == resume_id)
        job = next(j for j in TEST_JOB_DESCRIPTIONS if j["id"] == job_id)

        result = matcher.match(resume["text"], job["text"])
        score = result["match_score"]

        if expected == "high":
            correct = score >= 50
        else:
            correct = score < 50

        status = "✅" if correct else "❌"
        print(
            f"{status} {resume_id:20} → {job_id:20} "
            f"Score: {score:5.1f}% | Expected: {expected}"
        )
        results.append(
            {
                "pair": f"{resume_id}→{job_id}",
                "score": score,
                "expected": expected,
                "correct": correct,
            }
        )

    accuracy = sum(r["correct"] for r in results) / len(results) * 100
    print(
        f"Accuracy: {accuracy:.0f}% "
        f"({sum(r['correct'] for r in results)}/{len(results)})"
    )
    return results


def evaluate_llm_analyzer():
    print("\n" + "=" * 55)
    print("3. LLM Analyzer Evaluation")
    print("=" * 55)

    analyzer = LLMResumeAnalyzer()
    results = []

    for resume in TEST_RESUMES[:2]:
        print(f"\nResume: {resume['id']}")
        skills = analyzer.extract_skills(resume["text"])

        tech_count = len(skills.get("skills", {}).get("technical", []))
        has_suggestions = len(skills.get("improvement_suggestions", [])) > 0

        print(f"  Technical skills found : {tech_count}")
        print(f"  Job titles detected    : {skills.get('job_titles', [])}")
        print(f"  Has suggestions        : {has_suggestions}")

        results.append(
            {
                "resume": resume["id"],
                "tech_skills": tech_count,
                "has_suggestions": has_suggestions,
            }
        )

    return results


def save_results(ats_results, match_results, llm_results):
    os.makedirs("data/evaluation", exist_ok=True)

    report = {
        "phase": "Phase 4 - Experiment Evaluation",
        "ats_predictor": {
            "results": ats_results,
            "accuracy": sum(r["correct"] for r in ats_results) / len(ats_results) * 100,
        },
        "job_matcher": {
            "results": match_results,
            "accuracy": sum(r["correct"] for r in match_results)
            / len(match_results)
            * 100,
        },
        "llm_analyzer": {"results": llm_results},
    }

    with open("data/evaluation/eval_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\n✅ Report saved: data/evaluation/eval_report.json")
    return report


if __name__ == "__main__":
    print("=" * 55)
    print("ResumeVibe — Model Evaluation Report")
    print("=" * 55)

    ats_results = evaluate_ats_predictor()
    match_results = evaluate_job_matcher()
    llm_results = evaluate_llm_analyzer()
    report = save_results(ats_results, match_results, llm_results)

    print("\n" + "=" * 55)
    print("SUMMARY")
    print("=" * 55)
    print(f"ATS Predictor Accuracy : {report['ats_predictor']['accuracy']:.0f}%")
    print(f"Job Matcher Accuracy   : {report['job_matcher']['accuracy']:.0f}%")
    print("LLM Analyzer           : ✅ Working")
    print("=" * 55)
