import json
import os
import pickle

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

FEATURE_COLS = [
    "has_education",
    "has_experience",
    "has_skills",
    "has_projects",
    "has_summary",
    "has_cert",
    "has_email",
    "has_phone",
    "metric_count",
    "word_count",
    "category_encoded",
]


class ATSPredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.model_path = "app/ml/ats_model.pkl"
        self.encoder_path = "app/ml/label_encoder.pkl"
        self.metrics_path = "app/ml/training_metrics.json"

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        if "Category" in df.columns:
            df["category_encoded"] = self.label_encoder.fit_transform(
                df["Category"].fillna("Unknown")
            )
        else:
            df["category_encoded"] = 0

        bool_cols = [
            "has_education",
            "has_experience",
            "has_skills",
            "has_projects",
            "has_summary",
            "has_cert",
            "has_email",
            "has_phone",
        ]
        for col in bool_cols:
            if col in df.columns:
                df[col] = df[col].astype(int)
            else:
                df[col] = 0

        for col in FEATURE_COLS:
            if col not in df.columns:
                df[col] = 0

        return df[FEATURE_COLS]

    def train(self, data_path: str):
        print("Loading data...")
        df = pd.read_csv(data_path)
        print("Dataset:", df.shape)

        X = self.prepare_features(df)
        y = df["ats_score"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        print("Train:", X_train.shape, "Test:", X_test.shape)

        params = {
            "n_estimators": 200,
            "max_depth": 6,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
        }

        print("Training XGBoost...")
        self.model = xgb.XGBRegressor(**params)
        self.model.fit(X_train, y_train, verbose=False)

        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        print("\nResults:")
        print("  MAE :", round(mae, 2))
        print("  R2  :", round(r2, 4))

        importance = dict(zip(FEATURE_COLS, self.model.feature_importances_))
        print("\nFeature Importance:")
        for feat, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
            print(" ", feat.ljust(25), ":", round(imp, 4))

        os.makedirs("app/ml", exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
        with open(self.encoder_path, "wb") as f:
            pickle.dump(self.label_encoder, f)

        metrics = {
            "mae": round(mae, 4),
            "r2": round(r2, 4),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "params": params,
            "feature_importance": {
                k: round(float(v), 4)
                for k, v in sorted(
                    importance.items(),
                    key=lambda x: x[1],
                    reverse=True,
                )
            },
        }
        with open(self.metrics_path, "w") as f:
            json.dump(metrics, f, indent=2)

        print("\n✅ Model saved:", self.model_path)
        print("✅ Metrics saved:", self.metrics_path)
        return {"mae": mae, "r2": r2}

    def load(self):
        if not os.path.exists(self.model_path):
            print("Model not found, training...")
            data_path = "app/ml/resumes_processed.csv"
            if not os.path.exists(data_path):
                self._train_with_dummy_data()
                return
            self.train(data_path)
            return

        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(self.encoder_path, "rb") as f:
            self.label_encoder = pickle.load(f)

    def _train_with_dummy_data(self):
        """Minimal training data দিয়ে model তৈরি করো।"""
        import pandas as pd
        import numpy as np

        print("Training with dummy data...")
        n = 100
        data = {
            "has_education": np.random.randint(0, 2, n),
            "has_experience": np.random.randint(0, 2, n),
            "has_skills": np.random.randint(0, 2, n),
            "has_projects": np.random.randint(0, 2, n),
            "has_summary": np.random.randint(0, 2, n),
            "has_cert": np.random.randint(0, 2, n),
            "has_email": np.random.randint(0, 2, n),
            "has_phone": np.random.randint(0, 2, n),
            "metric_count": np.random.randint(0, 5, n),
            "word_count": np.random.randint(100, 800, n),
            "category_encoded": np.random.randint(0, 10, n),
            "ats_score": np.random.uniform(20, 90, n),
        }
        df = pd.DataFrame(data)

        X = df[FEATURE_COLS]
        y = df["ats_score"]

        self.model = xgb.XGBRegressor(n_estimators=50, max_depth=4, random_state=42)
        self.model.fit(X, y, verbose=False)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
        with open(self.encoder_path, "wb") as f:
            pickle.dump(self.label_encoder, f)
        print("✅ Dummy model trained and saved")

    def predict(self, features: dict) -> float:
        if self.model is None:
            self.load()

        df = pd.DataFrame([features])
        df["category_encoded"] = 0

        for col in FEATURE_COLS:
            if col not in df.columns:
                df[col] = 0

        score = self.model.predict(df[FEATURE_COLS])[0]
        return round(float(np.clip(score, 0, 100)), 1)
