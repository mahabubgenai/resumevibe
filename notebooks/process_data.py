import pandas as pd
import re
import os

os.makedirs("../data/processed", exist_ok=True)

df = pd.read_csv("../data/raw/resumes.csv")
print("Loaded:", df.shape)


# ── Step 1: Text Cleaning ──────────────────────────────
def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s\.\,\@\#\-\+\/\(\)]", " ", text)
    return text.strip().lower()


df["clean_text"] = df["Text"].apply(clean_text)


# ── Step 2: Feature Engineering ───────────────────────
def extract_features(text):
    text_lower = text.lower()

    sections = {
        "has_education": bool(
            re.search(r"\beducation\b|\bdegree\b|\buniversity\b", text_lower)
        ),
        "has_experience": bool(
            re.search(r"\bexperience\b|\bworked\b|\bemployed\b", text_lower)
        ),
        "has_skills": bool(
            re.search(r"\bskills\b|\btechnologies\b|\btools\b", text_lower)
        ),
        "has_projects": bool(
            re.search(r"\bproject\b|\bbuilt\b|\bdeveloped\b", text_lower)
        ),
        "has_summary": bool(
            re.search(r"\bsummary\b|\bobjective\b|\bprofile\b", text_lower)
        ),
        "has_cert": bool(re.search(r"\bcertif\b|\blicense\b|\bawarded\b", text_lower)),
    }

    metrics = re.findall(
        r"\d+[\%\+]|\$\d+|\d+\s*(?:years?|months?|teams?|clients?)", text_lower
    )

    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+", text_lower))
    has_phone = bool(re.search(r"\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b", text_lower))

    score = 0
    score += sum(sections.values()) * 10
    score += min(len(metrics) * 5, 20)
    score += 10 if has_email else 0
    score += 10 if len(text.split()) > 300 else 5

    return {
        **sections,
        "metric_count": len(metrics),
        "has_email": has_email,
        "has_phone": has_phone,
        "word_count": len(text.split()),
        "ats_score": min(score, 100),
    }


print("Extracting features...")
features = df["clean_text"].apply(extract_features).apply(pd.Series)
df = pd.concat([df, features], axis=1)


# ── Step 3: Quality Label ──────────────────────────────
def quality_label(score):
    if score >= 86:
        return "excellent"
    if score >= 71:
        return "good"
    if score >= 41:
        return "average"
    return "poor"


df["quality_label"] = df["ats_score"].apply(quality_label)

# ── Step 4: Save ───────────────────────────────────────
df.to_csv("../data/processed/resumes_processed.csv", index=False)

# ── Step 5: Summary ────────────────────────────────────
print("Processed:", df.shape)
print("\nATS Score stats:")
print(df["ats_score"].describe())
print("\nQuality labels:")
print(df["quality_label"].value_counts())
print("\nSection coverage:")
for col in ["has_education", "has_experience", "has_skills", "has_projects"]:
    pct = df[col].mean() * 100
    print(col + ":", round(pct, 1), "%")
print("\nSaved to data/processed/resumes_processed.csv")
