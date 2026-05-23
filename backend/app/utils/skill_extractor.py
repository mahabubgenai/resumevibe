import spacy
import re
from typing import Dict, List

nlp = spacy.load("en_core_web_sm")

TECH_SKILLS = {
    "programming_languages": [
        "python",
        "javascript",
        "typescript",
        "java",
        "c++",
        "c#",
        "c",
        "sql",
        "r",
        "go",
        "rust",
        "php",
        "ruby",
        "bash",
        "shell",
        "scala",
        "kotlin",
        "swift",
        "matlab",
        "perl",
    ],
    "web_frameworks": [
        "react",
        "next.js",
        "vue",
        "angular",
        "svelte",
        "fastapi",
        "django",
        "flask",
        "express",
        "spring boot",
        "laravel",
        "rails",
        "asp.net",
    ],
    "data_and_ml": [
        "machine learning",
        "deep learning",
        "nlp",
        "computer vision",
        "llm",
        "rag",
        "langchain",
        "huggingface",
        "transformers",
        "tensorflow",
        "pytorch",
        "keras",
        "scikit-learn",
        "xgboost",
        "pandas",
        "numpy",
        "matplotlib",
        "seaborn",
        "opencv",
        "data analysis",
        "data science",
        "statistics",
    ],
    "cloud_and_devops": [
        "aws",
        "gcp",
        "azure",
        "docker",
        "kubernetes",
        "terraform",
        "jenkins",
        "github actions",
        "ci/cd",
        "linux",
        "nginx",
        "ansible",
        "helm",
    ],
    "databases": [
        "postgresql",
        "mysql",
        "mongodb",
        "redis",
        "sqlite",
        "elasticsearch",
        "firebase",
        "supabase",
        "oracle",
        "sql server",
        "dynamodb",
    ],
    "networking": [
        "ospf",
        "eigrp",
        "bgp",
        "rip",
        "vlan",
        "dhcp",
        "dns",
        "nat",
        "tcp/ip",
        "vpn",
        "pppoe",
        "acl",
        "firewall",
        "lan",
        "wan",
        "ccna",
        "ccnp",
        "mikrotik",
        "cisco",
        "network security",
        "wireshark",
    ],
    "tools_and_platforms": [
        "git",
        "github",
        "gitlab",
        "jira",
        "confluence",
        "slack",
        "figma",
        "postman",
        "vs code",
        "vmware",
        "virtualbox",
        "cisco packet tracer",
        "gns3",
        "winbox",
        "matlab",
        "microsoft office",
        "excel",
        "power bi",
        "tableau",
    ],
    "it_support": [
        "help desk",
        "troubleshooting",
        "active directory",
        "windows server",
        "network cabling",
        "cctv",
        "hardware support",
        "software support",
        "it support",
        "tier-1",
        "tier-2",
        "sla",
        "ticketing",
    ],
    "soft_skills": [
        "leadership",
        "teamwork",
        "communication",
        "problem solving",
        "project management",
        "agile",
        "scrum",
        "time management",
        "critical thinking",
        "collaboration",
    ],
}


class SkillExtractor:
    def extract(self, text: str) -> Dict[str, List[str]]:
        text_lower = text.lower()
        found = {cat: [] for cat in TECH_SKILLS}

        for category, skills in TECH_SKILLS.items():
            for skill in skills:
                pattern = r"(?<![a-z])" + re.escape(skill) + r"(?![a-z])"
                if re.search(pattern, text_lower):
                    found[category].append(skill)

        # spaCy — clean organizations only
        doc = nlp(text[:5000])
        orgs = []
        for ent in doc.ents:
            if ent.label_ == "ORG":
                clean = ent.text.strip()
                # Garbage filter
                if (
                    len(clean) > 2
                    and len(clean.split()) <= 5
                    and not any(c in clean for c in ["@", "|", "/", "\\"])
                ):
                    orgs.append(clean)

        return {
            **found,
            "organizations": list(set(orgs))[:8],
            "total_skills": sum(len(v) for v in found.values()),
        }
