from datasets import load_dataset
import os

os.makedirs("../data/raw", exist_ok=True)

print("Downloading dataset...")
ds = load_dataset("ahmedheakl/resume-atlas")

ds["train"].to_csv("../data/raw/resumes.csv", index=False)
print(f"✅ Done! {len(ds['train'])} resumes saved.")
print("Location: data/raw/resumes.csv")
