import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="recruiter")  # admin, recruiter
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    jobs = relationship("Job", back_populates="creator")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), default="Engineering")
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)  # ["Python", "FastAPI"]
    preferred_skills = Column(JSON, default=list)  # ["Docker", "AWS"]
    min_experience = Column(Float, default=0.0)
    max_experience = Column(Float, default=10.0)
    education = Column(String(150), default="Bachelor's Degree")
    location = Column(String(150), default="Remote")
    employment_type = Column(String(50), default="Full-time")  # Full-time, Part-time, Contract, Internship
    work_mode = Column(String(50), default="Remote")  # Remote, Hybrid, On-site
    deadline = Column(DateTime(timezone=True), nullable=True)
    public_token = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(50), default="active")  # active, paused, closed
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    creator = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="job", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    education = Column(String(255), nullable=True)
    college = Column(String(255), nullable=True)
    degree = Column(String(150), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    current_company = Column(String(255), nullable=True)
    total_experience_years = Column(Float, default=0.0)
    parsed_skills = Column(JSON, default=list)
    raw_resume_text = Column(Text, nullable=True)
    resume_filename = Column(String(255), nullable=True)
    resume_path = Column(String(500), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False, index=True)
    stage = Column(String(50), default="Applied", index=True)
    # Stage lifecycle: Applied -> Screening -> Shortlisted -> Assessment -> Technical Interview -> HR Interview -> Offer -> Hired (or Rejected)
    previous_stage = Column(String(50), nullable=True)
    match_score = Column(Float, default=0.0, index=True)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    score_explanation = Column(Text, nullable=True)
    notes = Column(Text, default="")
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    emails = relationship("EmailLog", back_populates="application", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, default=30)
    passing_score = Column(Float, default=70.0)
    questions = Column(JSON, default=list)  # [{id, question, options: [], correct_idx: 0, points: 10}]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    job = relationship("Job", back_populates="assessments")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False)
    score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    candidate_answers = Column(JSON, default=dict)  # {q_id: answer_index}
    completed_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    assessment = relationship("Assessment", back_populates="attempts")
    application = relationship("Application", back_populates="assessment_attempts")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False)
    interview_type = Column(String(50), default="Technical")  # Technical, HR, Final
    title = Column(String(255), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=45)
    meeting_link = Column(String(500), nullable=True)
    interviewer_name = Column(String(255), default="Engineering Lead")
    interviewer_email = Column(String(255), nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    rating = Column(Float, nullable=True)  # 1 to 5 stars
    feedback = Column(Text, nullable=True)
    result = Column(String(50), default="pending")  # pending, passed, failed
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    application = relationship("Application", back_populates="interviews")

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True)
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=False)
    template_name = Column(String(100), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(50), default="sent")  # sent, failed
    sent_at = Column(DateTime(timezone=True), default=utc_now)
    
    application = relationship("Application", back_populates="emails")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., "STAGE_CHANGED", "JOB_CREATED"
    entity_type = Column(String(50), nullable=False)  # "Job", "Application", "Candidate"
    entity_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
