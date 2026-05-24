# ResumeVibe — Best Model Selection

## Models Evaluated

| Model | Task | Accuracy | Recommendation |
|---|---|---|---|
| XGBoost | ATS Score Prediction | 67% | ✅ Production |
| Groq LLaMA 3.3 70B | Skill Extraction + Rewriting | ROUGE: 17.9% | ✅ Production |
| sentence-transformers | Job-Resume Matching | 100% | ✅ Production |
| TinyLlama QLoRA | Resume Bullet Rewriting | Qualitative ✅ | Edge/Offline |

## Production Stack

- **ATS Scoring**: XGBoost (fast, lightweight)
- **Skill Extraction**: Groq LLaMA 3.3 70B (best quality)
- **ATS Feedback**: Groq LLaMA 3.3 70B
- **Job Matching**: sentence-transformers/all-MiniLM-L6-v2
- **Resume Rewriting**: Groq LLaMA 3.3 70B

## Fine-tuned Model

- **Model**: mahabub-unlocked/resumevibe-lora
- **Base**: TinyLlama-1.1B-Chat-v1.0
- **Use Case**: Offline/edge resume bullet rewriting
- **HuggingFace**: https://huggingface.co/mahabub-unlocked/resumevibe-lora

## Key Findings

1. Groq LLaMA 3.3 70B produces higher quality rewrites than reference
2. Job matcher achieves 100% accuracy on test cases
3. ATS predictor correctly identifies poor/average resumes
4. QLoRA fine-tuning works but needs more training data (500+ examples)