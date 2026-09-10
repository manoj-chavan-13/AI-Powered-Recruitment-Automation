from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import EmailLog, AuditLog, User
from app.schemas import EmailLogOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/emails", tags=["Email Logs & Auditing"])

@router.get("/logs", response_model=List[EmailLogOut])
def get_email_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(EmailLog).order_by(EmailLog.sent_at.desc()).limit(50).all()

@router.get("/audits")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
