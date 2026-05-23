import pandas as pd

df = pd.read_csv("../data/raw/resumes.csv")

print("Shape:", df.shape)
print("\nAll Categories:")
print(df["Category"].value_counts())
print("\nText sample:")
print(df["Text"].iloc[0][:500])
print("\nText length stats:")
df["word_count"] = df["Text"].str.split().str.len()
print(df["word_count"].describe())
