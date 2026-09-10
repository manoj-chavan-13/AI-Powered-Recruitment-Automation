import re
import os
from typing import Dict, List, Any, Optional
from pypdf import PdfReader

# Master skill taxonomy
TAXONOMY_SKILLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css", "r", "bash", "shell",
    # Frameworks & Libraries
    "fastapi", "django", "flask", "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js", "nodejs", "express", "express.js", "spring", "spring boot", "asp.net", "laravel", "tailwind", "tailwindcss", "redux", "graphql", "rest api", "restful api",
    # Cloud & DevOps
    "docker", "kubernetes", "aws", "amazon web services", "azure", "gcp", "google cloud", "ci/cd", "github actions", "gitlab", "terraform", "ansible", "linux", "nginx", "jenkins",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "elasticsearch", "cassandra", "dynamodb", "prisma", "sqlalchemy",
    # AI / ML / Data
    "machine learning", "deep learning", "nlp", "natural language processing", "llm", "large language models", "spacy", "nltk", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "opencv", "computer vision", "data analysis", "data science",
    # Core Engineering & Tools
    "git", "github", "microservices", "system design", "agile", "scrum", "jira", "unit testing", "pytest", "jest", "oop", "algorithms", "data structures"
]

DEGREE_PATTERNS = [
    r"\b(ph\.?d|doctorate)\b",
    r"\b(m\.?s|m\.?tech|m\.?sc|master'?s?|mba)\b",
    r"\b(b\.?e|b\.?tech|b\.?sc|bachelor'?s?|bba|bca|mca)\b",
    r"\b(diploma|associate)\b"
]

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extracts cleaned text from a PDF resume file."""
        if not os.path.exists(pdf_path):
            return ""
        text = ""
        try:
            reader = PdfReader(pdf_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            print(f"Error reading PDF {pdf_path}: {e}")
        return text.strip()

    @classmethod
    def parse_resume(cls, text: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """Parses extracted text into candidate profile fields."""
        cleaned_text = cls._clean_text(text)
        
        email = cls._extract_email(text)
        phone = cls._extract_phone(text)
        skills = cls._extract_skills(cleaned_text)
        experience_years = cls._extract_experience(cleaned_text)
        degree = cls._extract_degree(cleaned_text)
        
        return {
            "email": email,
            "phone": phone,
            "skills": skills,
            "total_experience_years": experience_years,
            "degree": degree,
            "raw_text": text[:5000] if text else "",
            "resume_filename": filename or "resume.pdf"
        }

    @staticmethod
    def _clean_text(text: str) -> str:
        return " ".join(text.split()).lower()

    @staticmethod
    def _extract_email(text: str) -> Optional[str]:
        match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_phone(text: str) -> Optional[str]:
        match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        return match.group(0) if match else None

    @classmethod
    def _extract_skills(cls, text_lower: str) -> List[str]:
        found = set()
        for skill in TAXONOMY_SKILLS:
            # Word boundary check
            escaped = re.escape(skill)
            pattern = rf"(?:\b|\W){escaped}(?:\b|\W)"
            if re.search(pattern, text_lower):
                # Standardize display format
                display_name = skill.title()
                if skill in ["fastapi", "postgresql", "mysql", "mongodb", "sqlite", "graphql", "github"]:
                    display_name = {
                        "fastapi": "FastAPI",
                        "postgresql": "PostgreSQL",
                        "mysql": "MySQL",
                        "mongodb": "MongoDB",
                        "sqlite": "SQLite",
                        "graphql": "GraphQL",
                        "github": "GitHub"
                    }[skill]
                elif skill in ["aws", "gcp", "ci/cd", "llm", "nlp", "sql", "html", "css", "oop"]:
                    display_name = skill.upper()
                found.add(display_name)
        return sorted(list(found))

    @staticmethod
    def _extract_experience(text_lower: str) -> float:
        """Finds explicit experience mentions or calculates year ranges."""
        # e.g., "5 years experience", "3+ yrs", "2.5 years of experience"
        exp_patterns = [
            r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)",
            r"experience\s*:\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)"
        ]
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass
        
        # Estimate from year ranges (e.g. 2021 - 2024)
        year_matches = re.findall(r"\b(20[012]\d)\s*(?:-|to|–)\s*(20[012]\d|present|current)\b", text_lower)
        total_range_years = 0.0
        current_year = 2026
        for start, end in year_matches:
            try:
                s = int(start)
                e = current_year if end in ["present", "current"] else int(end)
                if e >= s:
                    total_range_years += (e - s)
            except ValueError:
                pass
        
        if total_range_years > 0:
            return min(float(total_range_years), 25.0)
            
        return 1.5  # Default baseline for entry/mid

    @staticmethod
    def _extract_degree(text_lower: str) -> str:
        for pattern in DEGREE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                deg = match.group(1).upper()
                if "PH" in deg or "DOCTOR" in deg:
                    return "Ph.D"
                elif "M" in deg or "MASTER" in deg:
                    return "Master's Degree"
                elif "B" in deg or "BACHELOR" in deg:
                    return "Bachelor's Degree"
                return "Diploma"
        return "Bachelor's Degree"
