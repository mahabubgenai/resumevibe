# ResumeVibe — AI-Powered Resume Platform

<div align="center">

![ResumeVibe](https://img.shields.io/badge/ResumeVibe-AI%20Resume%20Platform-10B981?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi)
![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=for-the-badge)

**Live Demo:** [resumevibe.vercel.app](https://resumevibe.vercel.app)  
**API:** [mahabub-unlocked-resumevibe-api.hf.space](https://mahabub-unlocked-resumevibe-api.hf.space)

</div>

---

## Overview

ResumeVibe is a full-stack AI-powered resume analysis SaaS platform built with
Next.js 14, FastAPI, LangGraph, and Groq LLaMA 3.3 70B. It provides 15+
AI-powered features to help job seekers optimize their resumes and land their
dream jobs.

---

## Features

| Feature | Description |
|---|---|
| **ATS Score** | XGBoost-based ATS compatibility scoring |
| **AI Skill Extraction** | LLaMA 3.3 70B extracts skills from any profession |
| **Job Match Scoring** | Semantic similarity with sentence-transformers |
| **Resume Rewriter** | AI rewrites with action verbs & ATS keywords |
| **Interview Q&A** | Personalized questions with ideal answers |
| **Career Path Suggester** | AI suggests next career moves with roadmap |
| **Resume Roaster** | Humorous + helpful resume feedback |
| **Skill Roadmap** | Month-by-month learning plan |
| **Resume vs Job Fit** | Keyword gap analysis with quick fixes |
| **Cover Letter Generator** | Personalized cover letters with tone options |
| **Job Finder** | Real job listings via Tavily web search |
| **AI Coach** | RAG-powered resume coaching chatbot |
| **PDF Export** | Download full analysis as PDF report |
| **LangGraph Pipeline** | 5-agent sequential analysis pipeline |
| **WebSocket Progress** | Real-time analysis progress tracking |

---

## Tech Stack

### Frontend
- **Next.js 14** — App Router, TypeScript, Tailwind CSS
- **Supabase Auth** — User authentication
- **Stripe** — Payment processing (Free/Pro tiers)

### Backend
- **FastAPI** — REST API + WebSocket
- **LangGraph** — Multi-agent pipeline
- **Groq LLaMA 3.3 70B** — AI analysis & generation
- **ChromaDB** — RAG vector store
- **XGBoost** — ATS score prediction
- **sentence-transformers** — Job match scoring
- **Tavily** — Job search API
- **ReportLab** — PDF generation

### Infrastructure
- **Vercel** — Frontend deployment
- **HuggingFace Spaces** — Backend deployment (Docker)
- **Supabase** — PostgreSQL database + Auth
- **GitHub** — Version control + CI/CD

---

## Architecture
User Upload (PDF/DOCX)
↓
Agent 1: Parse & Extract
↓
Agent 2: Section Detection
↓
Agent 3: XGBoost ATS Score
↓
Agent 4: Groq LLM Analysis
↓
Agent 5: Job Match Scoring
↓
Final Report + PDF Export

---

## Project Structure
resumevibe/
├── frontend/          # Next.js 14 app
│   └── src/
│       ├── app/       # Pages (analyze, auth, dashboard, pricing)
│       ├── components/# Resume analysis components (15+ features)
│       └── lib/       # API client, Supabase client
├── backend/           # FastAPI app
│   └── app/
│       ├── ml/        # AI/ML models (XGBoost, LLM, RAG, etc.)
│       ├── utils/     # Parser, segmenter, skill extractor
│       ├── db/        # Supabase client
│       └── payments/  # Stripe handler
├── notebooks/         # Training scripts, EDA, evaluation
└── data/              # Processed datasets

---

## ML Pipeline
Dataset: 13,389 resumes (HuggingFace)
↓
Text Cleaning + Feature Engineering
↓
XGBoost ATS Predictor (MAE: 0.09, R²: 0.9993)
↓
Groq LLaMA 3.3 70B (skill extraction + feedback)
↓
sentence-transformers (job match scoring)
↓
QLoRA Fine-tuned TinyLlama (HuggingFace Hub)

---

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
TAVILY_API_KEY=
FRONTEND_URL=

**Frontend `.env.local`:**
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=

---

## Built By

**Mahabub Alam Bishal** — AI/ML Engineer  
GitHub: [@mdmahabubalambishal](https://github.com/mdmahabubalambishal)  
HuggingFace: [mahabub-unlocked](https://huggingface.co/mahabub-unlocked)