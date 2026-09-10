import os
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Candidate, Application, Job, User, Interview, AssessmentAttempt, EmailLog
from app.schemas import ApplicationOut, CandidateOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/candidates", tags=["Candidates & Applications"])

@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    job_id: Optional[str] = None,
    stage: Optional[str] = None,
    min_score: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Application).join(Candidate).join(Job)
    
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if stage:
        query = query.filter(Application.stage == stage)
    if min_score is not None:
        query = query.filter(Application.match_score >= min_score)
    if search:
        query = query.filter(
            Candidate.full_name.ilike(f"%{search}%") |
            Candidate.email.ilike(f"%{search}%") |
            Job.title.ilike(f"%{search}%")
        )
        
    applications = query.order_by(Application.match_score.desc()).all()
    return applications

@router.get("/application/{application_id}")
def get_application_details(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    interviews = db.query(Interview).filter(Interview.application_id == application_id).all()
    assessments = db.query(AssessmentAttempt).filter(AssessmentAttempt.application_id == application_id).all()
    emails = db.query(EmailLog).filter(EmailLog.application_id == application_id).order_by(EmailLog.sent_at.desc()).all()
    
    return {
        "application": app,
        "candidate": app.candidate,
        "job": app.job,
        "interviews": interviews,
        "assessments": assessments,
        "emails": emails
    }

@router.get("/application/{application_id}/resume")
def download_resume(
    application_id: str,
    download: bool = Query(False),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app or not app.candidate or not app.candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume file not found")
        
    path = app.candidate.resume_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Resume file does not exist on disk")
        
    disposition = "attachment" if download else "inline"
    return FileResponse(
        path,
        media_type="application/pdf",
        content_disposition_type=disposition,
        filename=app.candidate.resume_filename or "candidate_resume.pdf"
    )
