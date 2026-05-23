import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.ml.ats_predictor import ATSPredictor  # noqa: E402

DATA_PATH = "data/processed/resumes_processed.csv"

print("=" * 50)
print("ATS Score Predictor — XGBoost Training")
print("=" * 50)

predictor = ATSPredictor()
results = predictor.train(DATA_PATH)

print("\n" + "=" * 50)
print("Training Complete!")
print("MAE :", round(results["mae"], 2), "points")
print("R2  :", round(results["r2"], 4))
print("=" * 50)
