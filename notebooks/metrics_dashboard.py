import json
import os

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.makedirs("data/evaluation", exist_ok=True)

# Load evaluation report
with open("backend/data/evaluation/eval_report.json") as f:
    report = json.load(f)

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("ResumeVibe — Model Evaluation Dashboard", fontsize=16, fontweight="bold")

# ── Chart 1: Model Accuracy Comparison ────────────────
ax1 = axes[0, 0]
models = [
    "ATS Predictor\n(XGBoost)",
    "Job Matcher\n(Embeddings)",
    "LLM Analyzer\n(Groq)",
]
accuracies = [
    report["ats_predictor"]["accuracy"],
    report["job_matcher"]["accuracy"],
    100,
]
colors = ["#FF6B6B", "#00FFB2", "#60A5FA"]
bars = ax1.bar(models, accuracies, color=colors, edgecolor="white", linewidth=1.5)
ax1.set_ylim(0, 115)
ax1.set_ylabel("Accuracy (%)")
ax1.set_title("Model Accuracy Comparison")
for bar, acc in zip(bars, accuracies):
    ax1.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + 2,
        f"{acc:.0f}%",
        ha="center",
        fontweight="bold",
    )
ax1.set_facecolor("#0D1B24")
ax1.spines["bottom"].set_color("#2A3E4D")
ax1.spines["left"].set_color("#2A3E4D")

# ── Chart 2: ATS Score Distribution ───────────────────
ax2 = axes[0, 1]
resume_ids = [r["resume"] for r in report["ats_predictor"]["results"]]
ats_scores = [r["ats_score"] for r in report["ats_predictor"]["results"]]
bar_colors = [
    "#00FFB2" if r["correct"] else "#FF6B6B" for r in report["ats_predictor"]["results"]
]
bars2 = ax2.bar(resume_ids, ats_scores, color=bar_colors, edgecolor="white")
ax2.axhline(
    y=71, color="#FBBF24", linestyle="--", alpha=0.7, label="Good threshold (71)"
)
ax2.axhline(
    y=41, color="#FF6B6B", linestyle="--", alpha=0.7, label="Average threshold (41)"
)
ax2.set_ylim(0, 100)
ax2.set_ylabel("ATS Score")
ax2.set_title("ATS Scores by Resume")
ax2.legend(fontsize=8)
correct_patch = mpatches.Patch(color="#00FFB2", label="Correct")
wrong_patch = mpatches.Patch(color="#FF6B6B", label="Incorrect")
ax2.legend(handles=[correct_patch, wrong_patch], fontsize=8)
for bar, score in zip(bars2, ats_scores):
    ax2.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + 1,
        f"{score:.1f}",
        ha="center",
        fontsize=9,
    )

# ── Chart 3: Job Match Scores ──────────────────────────
ax3 = axes[1, 0]
pairs = [r["pair"].replace("→", "\n→\n") for r in report["job_matcher"]["results"]]
match_scores = [r["score"] for r in report["job_matcher"]["results"]]
match_colors = [
    "#00FFB2" if r["correct"] else "#FF6B6B" for r in report["job_matcher"]["results"]
]
bars3 = ax3.bar(pairs, match_scores, color=match_colors, edgecolor="white")
ax3.axhline(
    y=50, color="#FBBF24", linestyle="--", alpha=0.7, label="Match threshold (50%)"
)
ax3.set_ylim(0, 100)
ax3.set_ylabel("Match Score (%)")
ax3.set_title("Job-Resume Match Scores")
ax3.legend(fontsize=8)
for bar, score in zip(bars3, match_scores):
    ax3.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + 1,
        f"{score:.1f}%",
        ha="center",
        fontsize=9,
    )

# ── Chart 4: LLM Skills Detected ──────────────────────
ax4 = axes[1, 1]
llm_resumes = [r["resume"] for r in report["llm_analyzer"]["results"]]
tech_skills = [r["tech_skills"] for r in report["llm_analyzer"]["results"]]
ax4.barh(llm_resumes, tech_skills, color="#A78BFA", edgecolor="white")
ax4.set_xlabel("Technical Skills Detected")
ax4.set_title("LLM Skill Extraction Results")
for i, (resume, count) in enumerate(zip(llm_resumes, tech_skills)):
    ax4.text(count + 0.1, i, str(count), va="center", fontweight="bold")

plt.tight_layout()
plt.savefig(
    "backend/data/evaluation/metrics_dashboard.png", dpi=150, bbox_inches="tight"
)
plt.show()
print("✅ Dashboard saved: data/evaluation/metrics_dashboard.png")
