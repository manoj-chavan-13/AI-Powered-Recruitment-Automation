from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Application, AuditLog, User
from app.schemas import StageUpdate, BulkStageUpdate, ApplicationOut
from app.services.email_service import EmailService
from app.api.deps import get_current_user

router = APIRouter(prefix="/pipeline", tags=["Recruitment Pipeline"])

VALID_STAGES = [
    "Applied",
    "Screening",
    "Shortlisted",
    "Assessment",
    "Technical Interview",
    "HR Interview",
    "Offer",
    "Hired",
    "Rejected"
]

@router.patch("/application/{application_id}/stage", response_model=ApplicationOut)
def update_stage(
    application_id: str,
    stage_data: StageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if stage_data.stage not in VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {', '.join(VALID_STAGES)}")
        
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    old_stage = app.stage
    app.previous_stage = old_stage
    app.stage = stage_data.stage
    
    if stage_data.notes:
        app.notes = (app.notes or "") + f"\n[{stage_data.stage}] " + stage_data.notes
        
    if stage_data.stage == "Rejected":
        app.rejection_reason = stage_data.rejection_reason or "Profile requirements mismatch"
        
    db.commit()
    db.refresh(app)
    
    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        action="STAGE_TRANSITION",
        entity_type="Application",
        entity_id=app.id,
        details=f"Moved candidate '{app.candidate.full_name}' from {old_stage} to {stage_data.stage}"
    )
    db.add(audit)
    db.commit()
    
    # Automated email notification
    try:
        EmailService.send_notification(
            db=db,
            application=app,
            stage=stage_data.stage,
            custom_notes=stage_data.rejection_reason or stage_data.notes
        )
    except Exception as e:
        print(f"Failed to trigger automated email: {e}")
        
    return app

@router.post("/bulk-update")
def bulk_update_stages(
    bulk_data: BulkStageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if bulk_data.stage not in VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage: {bulk_data.stage}")
        
    updated = 0
    for app_id in bulk_data.application_ids:
        app = db.query(Application).filter(Application.id == app_id).first()
        if app:
            old_stage = app.stage
            app.previous_stage = old_stage
            app.stage = bulk_data.stage
            if bulk_data.notes:
                app.notes = (app.notes or "") + f"\n[{bulk_data.stage}] " + bulk_data.notes
            
            # Send notification
            try:
                EmailService.send_notification(db, app, stage=bulk_data.stage, custom_notes=bulk_data.notes)
            except Exception:
                pass
            updated += 1
            
    db.commit()
    return {"message": f"Successfully updated {updated} applications to {bulk_data.stage}"}
