from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Interview, Application, User
from app.schemas import InterviewCreate, InterviewFeedback, InterviewOut
from app.services.email_service import EmailService
from app.api.deps import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.get("/", response_model=List[InterviewOut])
def list_interviews(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Interview)
    if status:
        query = query.filter(Interview.status == status)
    return query.order_by(Interview.scheduled_at.asc()).all()

@router.post("/", response_model=InterviewOut)
def schedule_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == data.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    interview = Interview(
        application_id=data.application_id,
        interview_type=data.interview_type,
        title=data.title,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        meeting_link=data.meeting_link or "https://meet.google.com/ats-interview-room",
        interviewer_name=data.interviewer_name,
        interviewer_email=data.interviewer_email,
        status="scheduled",
        result="pending"
    )
    db.add(interview)
    
    # Auto transition stage
    target_stage = "Technical Interview" if data.interview_type == "Technical" else "HR Interview"
    if app.stage != target_stage:
        app.stage = target_stage
        
    db.commit()
    db.refresh(interview)
    
    # Send interview invite
    try:
        EmailService.send_notification(db, app, stage=target_stage)
    except Exception as e:
        print(f"Error sending interview invite: {e}")
        
    return interview

@router.patch("/{interview_id}/feedback", response_model=InterviewOut)
def record_feedback(
    interview_id: str,
    feedback_data: InterviewFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    interview.rating = feedback_data.rating
    interview.feedback = feedback_data.feedback
    interview.result = feedback_data.result
    interview.status = "completed"
    
    app = interview.application
    if app:
        if feedback_data.result == "passed":
            if interview.interview_type == "Technical":
                app.stage = "HR Interview"
            elif interview.interview_type == "HR":
                app.stage = "Offer"
        elif feedback_data.result == "failed":
            app.stage = "Rejected"
            app.rejection_reason = f"Did not pass {interview.interview_type} round: {feedback_data.feedback}"
            
    db.commit()
    db.refresh(interview)
    return interview
