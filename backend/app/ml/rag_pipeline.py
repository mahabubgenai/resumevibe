import json
import os

from groq import Groq
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHROMA_DB_PATH = "app/ml/chroma_db"
COLLECTION_NAME = "resume_knowledge"

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

RESUME_KNOWLEDGE = [
    {
        "content": """Strong resume summaries should be 3-4 sentences,
        highlight years of experience, key skills, and career goals.
        Use action verbs and quantify achievements where possible.
        Example: Results-driven Software Engineer with 5+ years building
        scalable web applications. Expert in Python, FastAPI, and React.
        Delivered 3 major products serving 100K+ users.""",
        "topic": "resume_summary",
        "category": "writing_tips",
    },
    {
        "content": """ATS (Applicant Tracking System) optimization tips:
        1. Use standard section headings (Experience, Education, Skills)
        2. Include keywords from the job description
        3. Avoid tables, graphics, and fancy formatting
        4. Use standard fonts (Arial, Calibri, Times New Roman)
        5. Save as PDF or DOCX
        6. Include measurable achievements with numbers""",
        "topic": "ats_optimization",
        "category": "ats_tips",
    },
    {
        "content": """Work experience bullet points should follow the
        STAR format: Situation, Task, Action, Result.
        Always quantify: increased sales by 30%, reduced costs by $50K,
        managed team of 10 engineers, served 1M+ users.
        Use strong action verbs: Developed, Led, Implemented, Achieved,
        Designed, Built, Optimized, Delivered, Managed.""",
        "topic": "experience_writing",
        "category": "writing_tips",
    },
    {
        "content": """Skills section best practices:
        - List technical skills first (programming languages, frameworks, tools)
        - Group skills by category
        - Only list skills you can discuss in an interview
        - Include both hard skills and soft skills
        - Match skills to job description keywords
        - For tech roles: include programming languages, frameworks,
          databases, cloud platforms, and tools""",
        "topic": "skills_section",
        "category": "writing_tips",
    },
    {
        "content": """Education section should include:
        - Degree name and major
        - University name and location
        - Graduation year
        - GPA if above 3.5
        - Relevant coursework, honors, or awards
        - For recent graduates: put education before experience""",
        "topic": "education_section",
        "category": "writing_tips",
    },
    {
        "content": """Common resume mistakes to avoid:
        1. Typos and grammatical errors
        2. Using first person (I, me, my)
        3. Including photo, age, marital status
        4. Using generic objectives instead of summaries
        5. Listing duties instead of achievements
        6. Making resume too long (keep to 1-2 pages)
        7. Using unprofessional email addresses
        8. Not customizing for each job application""",
        "topic": "common_mistakes",
        "category": "mistakes",
    },
    {
        "content": """For Software Engineer resumes:
        - Include GitHub profile with active repositories
        - List programming languages with proficiency levels
        - Highlight projects with tech stack and impact
        - Include open source contributions
        - Mention cloud platforms (AWS, GCP, Azure)
        - Add certifications (AWS, Google Cloud, etc.)""",
        "topic": "software_engineer_resume",
        "category": "profession_specific",
    },
    {
        "content": """For Network Engineer resumes:
        - List certifications prominently (CCNA, CCNP, CompTIA)
        - Include specific routing protocols (OSPF, EIGRP, BGP)
        - Mention network size managed (500+ users, enterprise network)
        - Highlight uptime achievements (99.9% uptime)
        - Include security experience (firewall, ACL, VPN)
        - List tools (Cisco Packet Tracer, GNS3, Wireshark)""",
        "topic": "network_engineer_resume",
        "category": "profession_specific",
    },
    {
        "content": """For Data Science resumes:
        - Highlight Python, R, SQL proficiency
        - Include ML frameworks (TensorFlow, PyTorch, scikit-learn)
        - Mention dataset sizes worked with (1M+ records)
        - Include Kaggle competitions or research papers
        - Add visualization tools (Tableau, Power BI, matplotlib)
        - Highlight business impact of models built""",
        "topic": "data_science_resume",
        "category": "profession_specific",
    },
    {
        "content": """Job application strategy:
        - Tailor resume for each application
        - Mirror keywords from job description
        - Research company before applying
        - Follow up within 1 week
        - Track applications in spreadsheet
        - Network on LinkedIn before applying
        - Apply within first 48 hours of posting""",
        "topic": "job_application_strategy",
        "category": "career_tips",
    },
]


class ResumeRAGPipeline:
    def __init__(self):
        self.vectorstore = None
        self._initialize_db()

    def _initialize_db(self):
        os.makedirs(CHROMA_DB_PATH, exist_ok=True)

        documents = [
            Document(
                page_content=item["content"],
                metadata={
                    "topic": item["topic"],
                    "category": item["category"],
                },
            )
            for item in RESUME_KNOWLEDGE
        ]

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
        )
        chunks = splitter.split_documents(documents)

        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_DB_PATH,
            collection_name=COLLECTION_NAME,
        )
        print("✅ RAG knowledge base initialized")

    def get_relevant_context(self, query: str, k: int = 3) -> str:
        docs = self.vectorstore.similarity_search(query, k=k)
        context = "\n\n".join(
            f"[{doc.metadata['topic']}]\n{doc.page_content}" for doc in docs
        )
        return context

    def answer_question(self, question: str, resume_text: str = "") -> str:
        context = self.get_relevant_context(question)

        system_prompt = """You are an expert resume coach with deep knowledge
        of ATS systems, hiring practices, and career development.
        Use the provided knowledge base context to give specific,
        actionable advice. Be concise and practical."""

        user_prompt = (
            f"Knowledge Base Context:\n{context}\n\n"
            + (f"Resume Context: {resume_text[:1000]}\n\n" if resume_text else "")
            + f"Question: {question}\n\n"
            + "Please provide specific, actionable advice based on the context above."
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()

    def get_improvement_tips(self, resume_text: str, job_title: str = "") -> dict:
        query = (
            f"resume tips for {job_title}" if job_title else "resume improvement tips"
        )
        context = self.get_relevant_context(query, k=4)

        prompt = (
            "Based on this resume and best practices, provide specific "
            "improvement tips.\n\n"
            f"Resume (first 1500 chars):\n{resume_text[:1500]}\n\n"
            f"Knowledge Base:\n{context}\n\n"
            "Return a JSON object:\n"
            "{\n"
            '    "top_improvements": [],\n'
            '    "ats_tips": [],\n'
            '    "writing_tips": [],\n'
            '    "overall_score_potential": ""\n'
            "}"
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a resume expert. "
                        "Always respond with valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )

        result = response.choices[0].message.content.strip()
        result = result.replace("```json", "").replace("```", "").strip()
        return json.loads(result)


rag_pipeline = ResumeRAGPipeline()
