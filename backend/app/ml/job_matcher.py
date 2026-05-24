from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")


class JobMatcher:
    def match(self, resume_text: str, job_description: str) -> dict:
        resume_emb = model.encode(resume_text[:2000])
        job_emb = model.encode(job_description[:2000])

        # Cosine similarity
        similarity = float(
            np.dot(resume_emb, job_emb)
            / (np.linalg.norm(resume_emb) * np.linalg.norm(job_emb))
        )
        match_score = round(similarity * 100, 1)

        if match_score >= 75:
            level = "excellent"
        elif match_score >= 55:
            level = "good"
        elif match_score >= 35:
            level = "average"
        else:
            level = "poor"

        return {
            "match_score": match_score,
            "match_level": level,
        }
