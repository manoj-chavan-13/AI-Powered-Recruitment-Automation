import os
import sys
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Job, Candidate, Application, Assessment, AssessmentAttempt, Interview, EmailLog, AuditLog
from app.services.matching_service import MatchingEngine

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).filter(User.email == "recruiter@talentiq.io").first():
        print("Database already seeded with core TalentIQ records.")
        db.close()
        return

    print("Initializing TalentIQ database with clean roles and active positions...")
    
    # 1. Users
    recruiter = User(
        email="recruiter@talentiq.io",
        full_name="Sarah Jenkins",
        hashed_password=get_password_hash("password123"),
        role="recruiter"
    )
    admin = User(
        email="admin@talentiq.io",
        full_name="Alexander Vance",
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    db.add_all([recruiter, admin])
    db.commit()
    db.refresh(recruiter)
    
    # 2. Jobs
    job1 = Job(
        title="Senior AI / Backend Engineer",
        department="AI & Platform Engineering",
        description=(
            "We are looking for a Senior AI / Backend Engineer to spearhead the core automation platform and LLM workflow services. "
            "You will architect high-throughput microservices using Python & FastAPI, scale PostgreSQL data layers, and integrate "
            "production neural network models and intelligent agents."
        ),
        required_skills=["Python", "FastAPI", "PostgreSQL", "REST API", "Docker", "Git"],
        preferred_skills=["PyTorch", "NLP", "LLM", "Redis", "AWS", "Kubernetes"],
        min_experience=3.0,
        max_experience=8.0,
        education="Bachelor's or Master's Degree in Computer Science",
        location="San Francisco, CA / Remote",
        employment_type="Full-time",
        work_mode="Remote",
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
        public_token="AI-BACKEND-8X9",
        status="active",
        created_by_id=recruiter.id
    )
    
    job2 = Job(
        title="Staff Frontend Architect",
        department="Product Experience",
        description=(
            "We are seeking a Staff Frontend Architect to craft mission-critical web applications with sub-millisecond response times, "
            "delightful glassmorphic aesthetics, and bulletproof TypeScript architectures. You will lead design system standardization, "
            "state management, and rich interactive dashboards."
        ),
        required_skills=["React", "TypeScript", "JavaScript", "HTML", "CSS", "REST API"],
        preferred_skills=["Next.js", "GraphQL", "Tailwind", "Jest", "Performance Optimization"],
        min_experience=4.0,
        max_experience=10.0,
        education="Bachelor's Degree in CS or equivalent",
        location="New York, NY / Hybrid",
        employment_type="Full-time",
        work_mode="Hybrid",
        deadline=datetime.now(timezone.utc) + timedelta(days=20),
        public_token="FRONTEND-ARC-42",
        status="active",
        created_by_id=recruiter.id
    )
    
    job3 = Job(
        title="Cloud DevOps & Infrastructure Lead",
        department="Core Infrastructure",
        description=(
            "Join our SRE & infrastructure team to manage multi-region Kubernetes clusters, automated zero-downtime CI/CD pipelines, "
            "and secure cloud environments on AWS."
        ),
        required_skills=["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Git"],
        preferred_skills=["Terraform", "Ansible", "Python", "Prometheus", "Nginx"],
        min_experience=3.5,
        max_experience=9.0,
        education="Bachelor's Degree",
        location="Austin, TX / Remote",
        employment_type="Full-time",
        work_mode="Remote",
        deadline=datetime.now(timezone.utc) + timedelta(days=45),
        public_token="DEVOPS-LEAD-77",
        status="active",
        created_by_id=recruiter.id
    )
    
    db.add_all([job1, job2, job3])
    db.commit()
    db.refresh(job1)
    db.refresh(job2)
    db.refresh(job3)
    
    # 3. Assessment Template for Job 1
    assessment1 = Assessment(
        job_id=job1.id,
        title="Python & System Design Technical Assessment",
        description="Comprehensive 3-question practical check covering async concurrency, database transactions, and API security.",
        time_limit_minutes=25,
        passing_score=70.0,
        questions=[
            {
                "id": "q1",
                "question": "In FastAPI, how does utilizing 'async def' differ from standard 'def' endpoints?",
                "options": [
                    "async def executes on the event loop, ideal for non-blocking I/O operations",
                    "async def forces multi-threaded CPU processing",
                    "def endpoints cannot connect to relational databases",
                    "There is no difference in runtime performance"
                ],
                "correct_idx": 0,
                "points": 35
            },
            {
                "id": "q2",
                "question": "Which PostgreSQL index type is most suitable for high-dimensional semantic vector similarity lookups?",
                "options": [
                    "B-Tree",
                    "HNSW (Hierarchical Navigable Small World)",
                    "Hash Index",
                    "BRIN"
                ],
                "correct_idx": 1,
                "points": 35
            },
            {
                "id": "q3",
                "question": "How should database connection pooling be handled in high-throughput microservices?",
                "options": [
                    "Open a fresh TCP socket connection per HTTP request",
                    "Maintain a managed pool of pre-allocated connections with max overflow limits",
                    "Store credentials in local browser storage",
                    "Disable database indexing"
                ],
                "correct_idx": 1,
                "points": 30
            }
        ],
        is_active=True
    )
    db.add(assessment1)
    db.commit()
    
    # 4. Clean Slate - No fake candidate data seeded
    print("Database ready: 3 active job openings ready for authentic applicant testing.")
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
