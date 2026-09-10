import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.services.resume_parser import ResumeParser
from app.services.matching_service import MatchingEngine
from app.models import Job, Candidate

def test_security():
    pwd = "superSecretPassword123"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongPass", hashed) is False
    
    token = create_access_token("user-id-123")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-id-123"

def test_resume_parser():
    sample_text = """
    Jane Doe
    Email: jane.doe@example.com
    Phone: (555) 123-4567
    Education: Master's Degree in Computer Science from MIT (2018 - 2020)
    Experience: 4 years of experience as a Backend Software Engineer (2020 - 2024).
    Skills: Python, FastAPI, Docker, PostgreSQL, REST API, Kubernetes, AWS.
    """
    parsed = ResumeParser.parse_resume(sample_text)
    assert parsed["email"] == "jane.doe@example.com"
    assert "FastAPI" in parsed["skills"]
    assert "PostgreSQL" in parsed["skills"]
    assert "Docker" in parsed["skills"]
    assert parsed["total_experience_years"] >= 3.5
    assert parsed["degree"] == "Master's Degree"

def test_matching_engine():
    job = Job(
        title="Python Backend Engineer",
        description="Looking for senior Python and FastAPI engineer with PostgreSQL experience",
        required_skills=["Python", "FastAPI", "PostgreSQL"],
        preferred_skills=["Docker", "AWS"],
        min_experience=3.0,
        max_experience=7.0,
        education="Bachelor's Degree"
    )
    
    candidate = Candidate(
        full_name="Alex Mercer",
        email="alex@test.com",
        degree="Master's Degree",
        total_experience_years=5.0,
        parsed_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Git"],
        raw_resume_text="Senior Python developer building high scale FastAPI services with PostgreSQL and Docker on AWS"
    )
    
    result = MatchingEngine.evaluate_candidate(job, candidate)
    assert result["match_score"] >= 85.0
    assert result["skill_score"] == 100.0
    assert result["experience_score"] == 100.0
    assert len(result["matched_skills"]) >= 3
    assert len(result["missing_skills"]) == 0
    assert "explanation" in result["score_explanation"].lower() or len(result["score_explanation"]) > 20
