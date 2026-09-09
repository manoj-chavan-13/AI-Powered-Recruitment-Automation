from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "recruiter"

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- Job Schemas ---
class JobBase(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience: float = 0.0
    max_experience: float = 10.0
    education: Optional[str] = "Bachelor's Degree"
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    work_mode: Optional[str] = "Remote"
    deadline: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    education: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class JobOut(JobBase):
    id: str
    public_token: str
    status: str
    created_at: datetime
    updated_at: datetime
    applicant_count: Optional[int] = 0
    class Config:
        from_attributes = True

class JobPublicOut(BaseModel):
    id: str
    title: str
    department: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    min_experience: float
    max_experience: float
    education: str
    location: str
    employment_type: str
    work_mode: str
    deadline: Optional[datetime]
    public_token: str
    status: str
    class Config:
        from_attributes = True

# --- Candidate & Application Schemas ---
class CandidateOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    current_company: Optional[str] = None
    total_experience_years: float
    parsed_skills: List[str] = []
    raw_resume_text: Optional[str] = None
    resume_filename: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    stage: str
    previous_stage: Optional[str] = None
    match_score: float
    skill_score: float
    experience_score: float
    education_score: float
    semantic_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    score_explanation: Optional[str] = None
    notes: Optional[str] = ""
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[CandidateOut] = None
    job: Optional[JobOut] = None
    class Config:
        from_attributes = True

class StageUpdate(BaseModel):
    stage: str
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None

class BulkStageUpdate(BaseModel):
    application_ids: List[str]
    stage: str
    notes: Optional[str] = None

# --- Assessment Schemas ---
class QuestionItem(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_idx: int
    points: int = 10

class AssessmentCreate(BaseModel):
    job_id: str
    title: str
    description: Optional[str] = None
    time_limit_minutes: int = 30
    passing_score: float = 70.0
    questions: List[QuestionItem] = []

class AssessmentOut(BaseModel):
    id: str
    job_id: str
    title: str
    description: Optional[str] = None
    time_limit_minutes: int
    passing_score: float
    questions: List[Dict[str, Any]] = []
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    questions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

class GenerateQuestionsRequest(BaseModel):
    job_title: str
    skills: List[str] = []
    count: int = 5

class AssessmentSubmission(BaseModel):
    application_id: str
    answers: Dict[str, int]  # {q_id: selected_index}
    proctoring_violations: Optional[int] = 0
    termination_reason: Optional[str] = None
    is_disqualified: Optional[bool] = False

# --- Interview Schemas ---
class InterviewCreate(BaseModel):
    application_id: str
    interview_type: str = "Technical"
    title: str
    scheduled_at: datetime
    duration_minutes: int = 45
    meeting_link: Optional[str] = None
    interviewer_name: str = "Lead Interviewer"
    interviewer_email: Optional[str] = None

class InterviewFeedback(BaseModel):
    rating: float
    feedback: str
    result: str  # passed, failed

class InterviewOut(BaseModel):
    id: str
    application_id: str
    interview_type: str
    title: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str] = None
    interviewer_name: str
    interviewer_email: Optional[str] = None
    status: str
    rating: Optional[float] = None
    feedback: Optional[str] = None
    result: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Email Log Schema ---
class EmailLogOut(BaseModel):
    id: str
    application_id: Optional[str] = None
    recipient_email: str
    recipient_name: Optional[str] = None
    subject: str
    template_name: str
    body: str
    status: str
    sent_at: datetime
    class Config:
        from_attributes = True

# --- Dashboard Stats ---
class DashboardOverview(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applicants: int
    hired_count: int
    average_match_score: float
    pipeline_funnel: Dict[str, int]
    recent_applications: List[ApplicationOut]
    top_skills_in_demand: List[Dict[str, Any]]
