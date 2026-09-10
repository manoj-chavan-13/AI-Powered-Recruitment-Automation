from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import Job, Application, Candidate, User
from app.schemas import DashboardOverview, ApplicationOut
from app.api.deps import get_current_user
from collections import Counter

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "active").count()
    total_applicants = db.query(Application).count()
    hired_count = db.query(Application).filter(Application.stage == "Hired").count()
    
    # Average match score
    avg_score_res = db.query(func.avg(Application.match_score)).scalar()
    avg_score = round(float(avg_score_res or 0.0), 1)
    
    # Pipeline funnel distribution
    stages = [
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
    funnel = {}
    for st in stages:
        funnel[st] = db.query(Application).filter(Application.stage == st).count()
        
    # Recent applicants
    recent_apps = (
        db.query(Application)
        .order_by(Application.created_at.desc())
        .limit(8)
        .all()
    )
    
    # Top skills in demand across all jobs
    jobs = db.query(Job).all()
    all_skills = []
    for j in jobs:
        if j.required_skills:
            all_skills.extend(j.required_skills)
        if j.preferred_skills:
            all_skills.extend(j.preferred_skills)
            
    skill_counts = Counter(all_skills).most_common(8)
    top_skills = [{"skill": s, "count": c} for s, c in skill_counts]
    
    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applicants": total_applicants,
        "hired_count": hired_count,
        "average_match_score": avg_score,
        "pipeline_funnel": funnel,
        "recent_applications": recent_apps,
        "top_skills_in_demand": top_skills
    }
