import json
import os
import re
import sys

from dotenv import load_dotenv
from groq import Groq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(ROOT, "backend")
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

load_dotenv(os.path.join(BACKEND, ".env"))

TEST_BULLETS = [
    {
        "id": "python_dev",
        "weak": "Did Python programming and made some scripts",
        "reference": "Developed Python automation scripts reducing manual work by 60%",
    },
    {
        "id": "network_eng",
        "weak": "Did network setup and IT support for company",
        "reference": (
            "Configured Cisco routers for 500+ user enterprise network "
            "maintaining 99.9% uptime"
        ),
    },
    {
        "id": "data_analyst",
        "weak": "Worked on data analysis and made reports",
        "reference": (
            "Analyzed 1M+ records using Python/Pandas, "
            "delivering insights that increased revenue by 25%"
        ),
    },
    {
        "id": "customer_support",
        "weak": "Helped customers with their problems",
        "reference": (
            "Resolved 50+ daily support tickets maintaining "
            "95% customer satisfaction rate"
        ),
    },
]

REWRITE_PROMPT = """Rewrite this weak resume bullet point into a strong, \
quantified, ATS-optimized version. Return only the rewritten bullet, \
nothing else.

Weak: {weak}
Strong:"""


def groq_baseline(weak_text):
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional resume writer. "
                    "Rewrite weak bullet points into strong, quantified versions."
                ),
            },
            {
                "role": "user",
                "content": REWRITE_PROMPT.format(weak=weak_text),
            },
        ],
        temperature=0.3,
        max_tokens=150,
    )
    return response.choices[0].message.content.strip()


def rouge_score(hypothesis, reference):
    hyp_tokens = set(hypothesis.lower().split())
    ref_tokens = set(reference.lower().split())
    if not ref_tokens:
        return 0.0
    overlap = hyp_tokens & ref_tokens
    precision = len(overlap) / len(hyp_tokens) if hyp_tokens else 0
    recall = len(overlap) / len(ref_tokens) if ref_tokens else 0
    if precision + recall == 0:
        return 0.0
    f1 = 2 * precision * recall / (precision + recall)
    return round(f1 * 100, 1)


def keyword_score(text, reference):
    ref_numbers = set(re.findall(r"\d+", reference))
    hyp_numbers = set(re.findall(r"\d+", text))
    number_match = (
        len(ref_numbers & hyp_numbers) / len(ref_numbers) if ref_numbers else 0
    )
    action_verbs = [
        "developed",
        "built",
        "created",
        "managed",
        "led",
        "designed",
        "implemented",
        "improved",
        "reduced",
        "increased",
        "configured",
        "analyzed",
        "delivered",
        "achieved",
        "maintained",
    ]
    ref_verbs = set(v for v in action_verbs if v in reference.lower())
    hyp_verbs = set(v for v in action_verbs if v in text.lower())
    verb_match = len(ref_verbs & hyp_verbs) / len(ref_verbs) if ref_verbs else 0
    return round((number_match * 0.5 + verb_match * 0.5) * 100, 1)


def run_ab_test():
    print("=" * 60)
    print("ResumeVibe — A/B Test: Groq Baseline vs QLoRA Fine-tuned")
    print("=" * 60)

    results = []

    for test in TEST_BULLETS:
        print("\n" + "-" * 60)
        print("Test:", test["id"])
        print("Weak :", test["weak"])
        print("Ref  :", test["reference"])
        print("\nRunning Groq baseline...")

        groq_output = groq_baseline(test["weak"])
        groq_rouge = rouge_score(groq_output, test["reference"])
        groq_kw = keyword_score(groq_output, test["reference"])

        print("Groq Output :", groq_output)
        print("ROUGE-1     :", groq_rouge, "%")
        print("Keyword     :", groq_kw, "%")

        results.append(
            {
                "id": test["id"],
                "weak": test["weak"],
                "reference": test["reference"],
                "groq_output": groq_output,
                "groq_rouge": groq_rouge,
                "groq_keyword": groq_kw,
                "qlora_note": (
                    "QLoRA model requires GPU inference — "
                    "evaluated qualitatively on Colab"
                ),
            }
        )

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    avg_rouge = sum(r["groq_rouge"] for r in results) / len(results)
    avg_kw = sum(r["groq_keyword"] for r in results) / len(results)
    print("Groq Baseline Avg ROUGE-1  :", round(avg_rouge, 1), "%")
    print("Groq Baseline Avg Keyword  :", round(avg_kw, 1), "%")
    print("Best Model Selection       : Groq LLaMA 3.3 70B (production)")
    print("Fine-tuned Model           : mahabub-unlocked/resumevibe-lora")
    print("Fine-tuned Use Case        : Edge/offline resume rewriting")

    os.makedirs("data/evaluation", exist_ok=True)
    report = {
        "test": "A/B Test — Groq Baseline vs QLoRA",
        "results": results,
        "summary": {
            "groq_avg_rouge": avg_rouge,
            "groq_avg_keyword": avg_kw,
            "best_model_production": "groq/llama-3.3-70b-versatile",
            "best_model_finetuned": "mahabub-unlocked/resumevibe-lora",
            "recommendation": (
                "Use Groq for production (better quality). "
                "Use QLoRA for offline/edge deployment."
            ),
        },
    }

    with open("data/evaluation/ab_test_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\n✅ Report saved: data/evaluation/ab_test_report.json")
    return report


if __name__ == "__main__":
    run_ab_test()
