import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Job, Application, User
from app.schemas import JobCreate, JobUpdate, JobOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def generate_public_token() -> str:
    return secrets.token_urlsafe(8)

@router.get("/", response_model=List[JobOut])
def list_jobs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))
    jobs = query.order_by(Job.created_at.desc()).all()
    
    # Attach applicant counts
    result = []
    for job in jobs:
        count = db.query(Application).filter(Application.job_id == job.id).count()
        job_dict = {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "description": job.description,
            "required_skills": job.required_skills or [],
            "preferred_skills": job.preferred_skills or [],
            "min_experience": job.min_experience,
            "max_experience": job.max_experience,
            "education": job.education,
            "location": job.location,
            "employment_type": job.employment_type,
            "work_mode": job.work_mode,
            "deadline": job.deadline,
            "public_token": job.public_token,
            "status": job.status,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
            "applicant_count": count
        }
        result.append(job_dict)
    return result

@router.post("/", response_model=JobOut)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    token = generate_public_token()
    while db.query(Job).filter(Job.public_token == token).first():
        token = generate_public_token()
        
    job = Job(
        title=job_in.title,
        department=job_in.department,
        description=job_in.description,
        required_skills=job_in.required_skills,
        preferred_skills=job_in.preferred_skills,
        min_experience=job_in.min_experience,
        max_experience=job_in.max_experience,
        education=job_in.education,
        location=job_in.location,
        employment_type=job_in.employment_type,
        work_mode=job_in.work_mode,
        deadline=job_in.deadline,
        public_token=token,
        status="active",
        created_by_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job.applicant_count = 0
    return job

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.applicant_count = db.query(Application).filter(Application.job_id == job.id).count()
    return job

@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: str,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    update_data = job_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
        
    db.commit()
    db.refresh(job)
    job.applicant_count = db.query(Application).filter(Application.job_id == job.id).count()
    return job

@router.post("/{job_id}/toggle-status")
def toggle_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "closed" if job.status == "active" else "active"
    db.commit()
    return {"id": job.id, "status": job.status}

@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
