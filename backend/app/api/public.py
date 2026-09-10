import os
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.models import Job, Candidate, Application
from app.schemas import JobPublicOut
from app.services.resume_parser import ResumeParser
from app.services.matching_service import MatchingEngine
from app.services.gemini_service import GeminiPostProcessor
from app.services.email_service import EmailService

router = APIRouter(prefix="/public", tags=["Public Portal"])

def is_expired(deadline) -> bool:
    if not deadline:
        return False
    now = datetime.now(timezone.utc)
    if getattr(deadline, "tzinfo", None) is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return now > deadline

@router.get("/apply/{token}", response_model=JobPublicOut)
def get_public_job(token: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.public_token == token).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid application link or job does not exist."
        )
        
    if job.status != "active":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Applications for this position are currently closed."
        )
        
    if is_expired(job.deadline):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The deadline for this job opening has expired."
        )
        
    return job

@router.post("/apply/{token}")
async def submit_application(
    token: str,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    education: Optional[str] = Form(None),
    college: Optional[str] = Form(None),
    degree: Optional[str] = Form(None),
    graduation_year: Optional[int] = Form(None),
    current_company: Optional[str] = Form(None),
    total_experience_years: Optional[float] = Form(None),
    skills: Optional[str] = Form(None),  # Comma-separated or JSON list
    linkedin_url: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    portfolio_url: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.public_token == token).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")
        
    if job.status != "active":
        raise HTTPException(status_code=400, detail="Applications for this job are closed.")
        
    if is_expired(job.deadline):
        raise HTTPException(status_code=400, detail="The application deadline has passed.")
        
    # File validation
    filename = resume.filename or "resume.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF format is supported for resume uploads.")
        
    saved_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.RESUME_DIR, saved_filename)
    
    # Save resume file locally
    contents = await resume.read()
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # 1. Resume text extraction & AI Post-Processing
    extracted_text = ResumeParser.extract_text_from_pdf(file_path)
    parsed_info = GeminiPostProcessor.parse_resume_with_gemini(extracted_text, filename=filename)
    
    # Merge manual user inputs with parsed data
    candidate_skills = parsed_info.get("skills", [])
    if skills:
        try:
            custom_skills = json.loads(skills) if skills.startswith("[") else [s.strip() for s in skills.split(",") if s.strip()]
            candidate_skills = list(set(candidate_skills + custom_skills))
        except Exception:
            pass
            
    exp_years = total_experience_years if total_experience_years is not None else parsed_info.get("total_experience_years", 1.5)
    cand_degree = degree or parsed_info.get("degree", "Bachelor's Degree")
    cand_college = college or parsed_info.get("college")
    cand_company = current_company or parsed_info.get("current_company")
    cand_phone = phone or parsed_info.get("phone")
    cand_location = location or parsed_info.get("location")
    
    # 2. Candidate Record
    candidate = Candidate(
        full_name=full_name.strip(),
        email=email.strip().lower(),
        phone=cand_phone,
        location=cand_location,
        education=education or cand_degree,
        college=cand_college,
        degree=cand_degree,
        graduation_year=graduation_year,
        current_company=cand_company,
        total_experience_years=exp_years,
        parsed_skills=candidate_skills,
        raw_resume_text=extracted_text,
        resume_filename=filename,
        resume_path=file_path,
        linkedin_url=linkedin_url,
        github_url=github_url,
        portfolio_url=portfolio_url
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # 3. Gemini AI Matching & Post-Processing
    eval_result = GeminiPostProcessor.evaluate_match_with_gemini(job, candidate, raw_resume_text=extracted_text)
    
    # Build comprehensive explanation
    base_explanation = eval_result.get("score_explanation", "")
    strengths = eval_result.get("key_strengths", [])
    gaps = eval_result.get("potential_gaps", [])
    interview_qs = eval_result.get("interview_questions", [])
    
    structured_explanation = base_explanation
    if strengths:
        structured_explanation += "\n\n🌟 Key Strengths:\n• " + "\n• ".join(strengths)
    if gaps:
        structured_explanation += "\n\n⚠️ Potential Gaps:\n• " + "\n• ".join(gaps)
        
    ai_notes = f"Evaluated via TalentIQ AI Engine (Score: {eval_result['match_score']}%)."
    if interview_qs:
        ai_notes += "\n\n🎯 Recommended Interview Questions:"
        for idx, q_item in enumerate(interview_qs, 1):
            if isinstance(q_item, dict):
                q_text = q_item.get("question", "")
                f_area = q_item.get("focus_area", "")
                look = q_item.get("look_for", "")
                ai_notes += f"\n{idx}. [{f_area}] {q_text}\n   → Look for: {look}"
            else:
                ai_notes += f"\n{idx}. {q_item}"
    
    # 4. Create Application in 'Applied' Stage
    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        stage="Applied",
        match_score=eval_result["match_score"],
        skill_score=eval_result["skill_score"],
        experience_score=eval_result["experience_score"],
        education_score=eval_result["education_score"],
        semantic_score=eval_result["semantic_score"],
        matched_skills=eval_result["matched_skills"],
        missing_skills=eval_result["missing_skills"],
        score_explanation=structured_explanation,
        notes=ai_notes
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # 5. Send automated confirmation email
    try:
        EmailService.send_notification(db, application, stage="Applied")
    except Exception as e:
        print(f"Error sending confirmation email: {e}")
        
    return {
        "success": True,
        "message": "Your application and resume were successfully submitted!",
        "application_id": application.id,
        "candidate_name": candidate.full_name,
        "job_title": job.title,
        "match_score": eval_result["match_score"]
    }
