from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models import Assessment, AssessmentAttempt, Application, Job, User, Interview
from app.schemas import AssessmentCreate, AssessmentOut, AssessmentSubmission, AssessmentUpdate, GenerateQuestionsRequest
from app.services.email_service import EmailService
from app.services.gemini_service import GeminiPostProcessor
from app.api.deps import get_current_user
import time

router = APIRouter(prefix="/assessments", tags=["Assessments"])

ROLE_DEFAULT_ASSESSMENTS = {
    "Cloud DevOps & Infrastructure Lead": {
        "title": "Cloud Infrastructure, Kubernetes & Terraform Technical Assessment",
        "description": "Comprehensive evaluation covering Kubernetes workload management, Infrastructure as Code (Terraform), VPC cloud networking, CI/CD orchestration, and high-availability architecture.",
        "time_limit_minutes": 25,
        "passing_score": 70.0,
        "questions": [
            {
                "id": "devops_q1",
                "question": "In Kubernetes, what is the primary operational distinction between a DaemonSet and a standard Deployment?",
                "options": [
                    "A DaemonSet guarantees that exactly one replica of a Pod runs across all (or eligible) nodes in the cluster, whereas a Deployment schedules pods based on cluster-wide resource capacity.",
                    "A DaemonSet automatically scales horizontally based on CPU thresholds via HPA.",
                    "A DaemonSet only executes batch jobs to completion and then shuts down.",
                    "A DaemonSet replaces the kube-proxy network routing layer."
                ],
                "correct_idx": 0,
                "points": 20
            },
            {
                "id": "devops_q2",
                "question": "Which Terraform command reconciles the real-world infrastructure state against local configuration without applying changes?",
                "options": [
                    "terraform apply -auto-approve",
                    "terraform plan (or terraform refresh)",
                    "terraform init -upgrade",
                    "terraform state rm"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "devops_q3",
                "question": "In an AWS VPC architecture, what is the standard pattern for enabling instances in a private subnet to securely reach the public internet for OS patches?",
                "options": [
                    "Assigning a public Elastic IP directly to the private EC2 instance",
                    "Routing outbound traffic through a NAT Gateway situated in a public subnet with an attached Internet Gateway",
                    "Creating an IAM role with AdministratorAccess attached to the instance profile",
                    "Opening inbound security group port 0.0.0.0/0 on all private instances"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "devops_q4",
                "question": "Which deployment strategy runs two identical production environments concurrently and instantly flips traffic at the routing layer once the new version is verified?",
                "options": [
                    "Rolling Update with 25% maxSurge",
                    "Blue/Green Deployment",
                    "Recreate Strategy with downtime",
                    "Canary deployment with 1% initial split"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "devops_q5",
                "question": "In Docker containerization and Kubernetes security benchmarks, why should production containers avoid running as root (UID 0)?",
                "options": [
                    "Because root containers cannot consume memory over 512MB",
                    "To prevent container breakout vulnerabilities that could grant adversaries root privileges on the underlying host kernel",
                    "Because the Docker daemon refuses to build images that declare USER 0",
                    "Because root processes cannot execute DNS resolution inside CoreDNS"
                ],
                "correct_idx": 1,
                "points": 20
            }
        ]
    },
    "Senior AI / Backend Engineer": {
        "title": "Distributed Systems, High-Concurrency Python & LLM Architecture Assessment",
        "description": "Evaluates asynchronous backend programming (ASGI/FastAPI), vector embeddings & RAG retrieval pipelines, transaction isolation, and microservices reliability.",
        "time_limit_minutes": 25,
        "passing_score": 70.0,
        "questions": [
            {
                "id": "ai_q1",
                "question": "In high-throughput Python ASGI web services (such as FastAPI), how must long-running CPU-bound calculations be handled to prevent blocking the async event loop?",
                "options": [
                    "Execute the computation inside a standard 'async def' coroutine with no awaiting",
                    "Offload the heavy computation to a ProcessPoolExecutor, Celery task queue, or background worker process",
                    "Call time.sleep() intermittently inside the loop to yield execution",
                    "Increase uvicorn worker threads to 1,000"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "ai_q2",
                "question": "What is the primary algorithmic advantage of using HNSW (Hierarchical Navigable Small World) indexing in vector databases for RAG architectures?",
                "options": [
                    "Logarithmic/sub-linear query latency for approximate nearest neighbor (ANN) similarity search across millions of embeddings",
                    "Lossless semantic compression of raw document text",
                    "Eliminates the requirement of prompt engineering during generation",
                    "Encrypts embeddings at rest using AES-256"
                ],
                "correct_idx": 0,
                "points": 20
            },
            {
                "id": "ai_q3",
                "question": "In transactional relational databases under heavy write traffic, what is the primary architectural trade-off of maintaining multiple secondary indexes?",
                "options": [
                    "Accelerated write speeds at the cost of slower query reads",
                    "Faster query lookups at the expense of increased write amplification, write latency, and storage overhead",
                    "Reduced buffer pool memory consumption",
                    "Automated database replication across regions"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "ai_q4",
                "question": "What critical distributed systems problem does the 'Transactional Outbox' pattern solve?",
                "options": [
                    "Atomically writing database changes and queuing events so that messages are never lost if the message broker is temporarily unreachable",
                    "Accelerating Redis caching at the network boundary",
                    "Encrypting client JSON payloads end-to-end",
                    "Generating cryptographically signed JWT tokens"
                ],
                "correct_idx": 0,
                "points": 20
            },
            {
                "id": "ai_q5",
                "question": "When querying LLM APIs (such as Google Gemini), what does setting temperature=0.0 accomplish?",
                "options": [
                    "Guarantees the lowest possible token latency",
                    "Forces greedy decoding where the model deterministically selects the highest-probability token at each step",
                    "Guarantees that the LLM will never hallucinate under any circumstance",
                    "Expands the context window by 2x"
                ],
                "correct_idx": 1,
                "points": 20
            }
        ]
    },
    "Staff Frontend Architect": {
        "title": "Modern React Architecture, Performance & Web Security Assessment",
        "description": "Evaluates React Concurrent Mode, Core Web Vitals optimization, Module Federation, state management, and modern browser security standards.",
        "time_limit_minutes": 25,
        "passing_score": 70.0,
        "questions": [
            {
                "id": "frontend_q1",
                "question": "In modern React, what is the primary benefit of 'useTransition' during complex UI updates?",
                "options": [
                    "It moves UI rendering to an offscreen Web Worker automatically",
                    "It marks state updates as non-blocking transitions, preserving main thread responsiveness for immediate user keystrokes and clicks",
                    "It compiles React components to WebAssembly in the browser",
                    "It replaces CSS animations with WebGL"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "frontend_q2",
                "question": "Which Core Web Vital specifically quantifies visual stability and unexpected layout shifts during document load?",
                "options": [
                    "First Contentful Paint (FCP)",
                    "Cumulative Layout Shift (CLS)",
                    "Interaction to Next Paint (INP)",
                    "Time to First Byte (TTFB)"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "frontend_q3",
                "question": "What is the primary protocol-level advantage of HTTP/3 (over QUIC) compared to HTTP/2 on lossy wireless networks?",
                "options": [
                    "Elimination of TCP head-of-line blocking when packets are dropped, allowing unaffected multiplexed streams to continue uninterrupted",
                    "Deprecation of TLS cryptography for faster speeds",
                    "Disabling browser client caching",
                    "Replacing JSON with Protocol Buffers natively"
                ],
                "correct_idx": 0,
                "points": 20
            },
            {
                "id": "frontend_q4",
                "question": "In Webpack/Vite Module Federation micro-frontend architectures, what purpose does the 'shared' configuration serve?",
                "options": [
                    "Forces all federated micro-apps to be hosted on the same origin domain",
                    "Permits independently deployed applications to share singleton instances of vendor packages (e.g. React) without duplicate bundle downloads",
                    "Merges all micro-apps into a single monolithic bundle at build time",
                    "Prevents micro-frontends from using CSS modules"
                ],
                "correct_idx": 1,
                "points": 20
            },
            {
                "id": "frontend_q5",
                "question": "Why is a Content Security Policy (CSP) utilizing nonces or hashes with 'strict-dynamic' superior to legacy domain-based allowlists?",
                "options": [
                    "It speeds up script parsing in JavaScript engines",
                    "It robustly defends against XSS by trusting only cryptographically signed scripts regardless of origin and prevents JSONP bypasses",
                    "It automatically bypasses CORS preflight requests",
                    "It enables offline caching in service workers"
                ],
                "correct_idx": 1,
                "points": 20
            }
        ]
    }
}


def ensure_job_assessment(db: Session, job: Job) -> Assessment:
    """
    Ensures that a rich, role-specific technical assessment exists for the given job.
    """
    existing = db.query(Assessment).filter(Assessment.job_id == job.id, Assessment.is_active == True).first()
    if existing:
        return existing

    # Find matching template or fallback to first
    template = ROLE_DEFAULT_ASSESSMENTS.get(job.title)
    if not template:
        # Check partial match
        for k, v in ROLE_DEFAULT_ASSESSMENTS.items():
            if any(term.lower() in job.title.lower() for term in k.split()):
                template = v
                break
        if not template:
            template = list(ROLE_DEFAULT_ASSESSMENTS.values())[0]

    new_assessment = Assessment(
        job_id=job.id,
        title=template["title"],
        description=template["description"],
        time_limit_minutes=template["time_limit_minutes"],
        passing_score=template["passing_score"],
        questions=template["questions"],
        is_active=True
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment


@router.get("/all", response_model=List[AssessmentOut])
def get_all_assessments(db: Session = Depends(get_db)):
    """Returns all active assessments across all jobs."""
    return db.query(Assessment).filter(Assessment.is_active == True).all()


@router.get("/job/{job_id}", response_model=List[AssessmentOut])
def get_job_assessments(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    ensure_job_assessment(db, job)
    return db.query(Assessment).filter(Assessment.job_id == job_id, Assessment.is_active == True).all()


@router.post("/", response_model=AssessmentOut)
def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == data.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Deactivate existing active assessments for this job if any
    db.query(Assessment).filter(Assessment.job_id == data.job_id).update({"is_active": False})

    assessment = Assessment(
        job_id=data.job_id,
        title=data.title,
        description=data.description,
        time_limit_minutes=data.time_limit_minutes,
        passing_score=data.passing_score,
        questions=[q.dict() if hasattr(q, 'dict') else q for q in data.questions],
        is_active=True
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.put("/{assessment_id}", response_model=AssessmentOut)
def update_assessment(
    assessment_id: str,
    data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recruiter endpoint to update assessment parameters:
    title, description, time_limit_minutes, passing_score, questions, is_active.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if data.title is not None:
        assessment.title = data.title.strip()
    if data.description is not None:
        assessment.description = data.description.strip()
    if data.time_limit_minutes is not None:
        assessment.time_limit_minutes = max(5, int(data.time_limit_minutes))
    if data.passing_score is not None:
        assessment.passing_score = max(10.0, min(100.0, float(data.passing_score)))
    if data.questions is not None:
        assessment.questions = data.questions
    if data.is_active is not None:
        assessment.is_active = data.is_active

    db.commit()
    db.refresh(assessment)
    return assessment


@router.post("/generate-questions")
def generate_questions(
    req: GenerateQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-powered question generator for recruiter assessment panel.
    Takes role title and required skills, returns 3-5 rigorous scenario questions.
    """
    questions = GeminiPostProcessor.generate_assessment_questions(
        job_title=req.job_title,
        required_skills=req.skills,
        count=min(10, max(1, req.count))
    )
    return {"questions": questions}


@router.get("/stats/{job_id}")
def get_assessment_stats(job_id: str, db: Session = Depends(get_db)):
    """
    Returns analytics and candidate performance metrics for the assessment of this job role.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    assessment = db.query(Assessment).filter(Assessment.job_id == job_id, Assessment.is_active == True).first()
    if not assessment:
        assessment = ensure_job_assessment(db, job)

    attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.assessment_id == assessment.id).all()
    
    # Applications currently in Assessment stage or past it
    all_apps = db.query(Application).filter(Application.job_id == job_id).all()
    in_assessment_stage = [a for a in all_apps if a.stage == "Assessment"]
    
    total_attempts = len(attempts)
    passed_attempts = [a for a in attempts if a.passed]
    passed_count = len(passed_attempts)
    pass_rate = round((passed_count / max(1, total_attempts)) * 100.0, 1) if total_attempts > 0 else 0.0
    avg_score = round(sum(a.score for a in attempts) / max(1, total_attempts), 1) if total_attempts > 0 else 0.0

    recent_attempts_list = []
    for att in sorted(attempts, key=lambda x: x.completed_at, reverse=True)[:8]:
        app_item = att.application
        cand = app_item.candidate if app_item else None
        recent_attempts_list.append({
            "attempt_id": att.id,
            "application_id": att.application_id,
            "candidate_name": cand.full_name if cand else "Applicant",
            "candidate_email": cand.email if cand else "",
            "score": att.score,
            "passed": att.passed,
            "completed_at": att.completed_at.isoformat() if att.completed_at else None,
            "current_stage": app_item.stage if app_item else "Assessment"
        })

    return {
        "job_id": job.id,
        "job_title": job.title,
        "assessment_id": assessment.id,
        "total_invited": len(in_assessment_stage),
        "total_completed": total_attempts,
        "passed_count": passed_count,
        "failed_count": total_attempts - passed_count,
        "pass_rate": pass_rate,
        "avg_score": avg_score,
        "passing_threshold": assessment.passing_score,
        "recent_attempts": recent_attempts_list
    }


@router.get("/application/{application_id}")
def get_candidate_assessment(
    application_id: str,
    db: Session = Depends(get_db)
):
    """
    Public candidate endpoint: retrieves assessment details and questions for an application.
    Security: Does NOT expose correct_idx to the browser.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")
        
    job = app.job
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidate = app.candidate
    assessment = ensure_job_assessment(db, job)
    
    # Check if candidate has already attempted
    existing_attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.application_id == application_id
    ).order_by(AssessmentAttempt.completed_at.desc()).first()
    
    if existing_attempt:
        # Also fetch scheduled interview if passed
        interview = None
        if existing_attempt.passed:
            interview = db.query(Interview).filter(Interview.application_id == application_id).first()
            
        return {
            "already_completed": True,
            "score": existing_attempt.score,
            "passed": existing_attempt.passed,
            "passing_threshold": assessment.passing_score,
            "completed_at": existing_attempt.completed_at,
            "candidate_name": candidate.full_name if candidate else "Candidate",
            "job_title": job.title,
            "assessment_title": assessment.title,
            "interview": {
                "meeting_link": interview.meeting_link if interview else None,
                "scheduled_at": interview.scheduled_at if interview else None,
                "interviewer_name": interview.interviewer_name if interview else None,
            } if interview else None
        }

    # Sanitize questions: strip correct_idx
    sanitized_questions = []
    for q in (assessment.questions or []):
        sanitized_questions.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "options": q.get("options", []),
            "points": q.get("points", 20)
        })

    return {
        "already_completed": False,
        "application_id": app.id,
        "candidate_name": candidate.full_name if candidate else "Candidate",
        "job_title": job.title,
        "assessment_id": assessment.id,
        "title": assessment.title,
        "description": assessment.description,
        "time_limit_minutes": assessment.time_limit_minutes,
        "passing_score": assessment.passing_score,
        "total_questions": len(sanitized_questions),
        "questions": sanitized_questions
    }


@router.post("/application/{application_id}/reset")
def reset_candidate_assessment(application_id: str, db: Session = Depends(get_db)):
    """
    Resets previous assessment attempts for testing/demo purposes.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    db.query(AssessmentAttempt).filter(AssessmentAttempt.application_id == application_id).delete()
    app.stage = "Assessment"
    db.commit()
    return {"message": "Assessment reset successfully for retake"}


def _send_assessment_result_email(
    application_id: str,
    pct_score: float,
    passed: bool,
    meet_link: Optional[str],
    sched_time: Optional[datetime],
    interviewer: Optional[str],
    stage: str,
    delay_seconds: int = 120
):
    """
    Background task: waits `delay_seconds` then dispatches the post-assessment
    result email so the HTTP response is never blocked by SMTP.
    """
    time.sleep(delay_seconds)
    # Re-open its own DB session since the request session is long gone
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import Application
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            return
        EmailService.send_notification(
            db=db,
            application=app,
            stage=stage,
            score=pct_score,
            meeting_link=meet_link,
            scheduled_at=sched_time,
            interviewer_name=interviewer
        )
        print(f"[EmailQueue] Queued result email dispatched for application {application_id}")
    except Exception as e:
        print(f"[EmailQueue] Background email dispatch error: {e}")
    finally:
        db.close()


@router.post("/submit")
def submit_assessment(
    submission: AssessmentSubmission,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate's assessment submission.
    - Result is NOT exposed in the response (candidate sees a 'wait for email' message).
    - Email notification is queued as a background task (non-blocking, delayed by 2 min)
      so that SMTP latency never slows down the candidate's submission response.
    If passed:
      1. Moves stage to 'Technical Interview'.
      2. Creates an Interview record with a Google Meet room and scheduled time.
      3. Queues the Technical Interview HTML invitation via background task.
    """
    app = db.query(Application).filter(Application.id == submission.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    assessment = ensure_job_assessment(db, app.job)
    questions = assessment.questions or []

    total_pts = 0
    earned_pts = 0

    for q in questions:
        q_id = str(q.get("id"))
        pts = q.get("points", 20)
        total_pts += pts
        correct_idx = q.get("correct_idx", 0)
        selected_idx = submission.answers.get(q_id)
        is_correct = (selected_idx is not None and int(selected_idx) == int(correct_idx))
        if is_correct:
            earned_pts += pts

    pct_score = round((earned_pts / max(1, total_pts)) * 100.0, 1)
    is_disqualified = bool(submission.is_disqualified)
    passed = (pct_score >= assessment.passing_score) and not is_disqualified

    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        application_id=app.id,
        score=0.0 if is_disqualified else pct_score,
        passed=passed,
        candidate_answers=submission.answers,
        completed_at=datetime.now(timezone.utc)
    )
    db.add(attempt)

    meet_link: Optional[str] = None
    sched_time: Optional[datetime] = None
    interviewer: Optional[str] = None
    email_stage = "Technical Interview" if passed else "Assessment"

    if is_disqualified:
        app.notes = (app.notes or "") + (
            f"\n[AI-Proctoring Disqualification] Assessment automatically terminated: "
            f"{submission.termination_reason or 'Cheating detected'} "
            f"({submission.proctoring_violations or 0} recorded violations)."
        )
    elif passed:
        app.previous_stage = app.stage
        app.stage = "Technical Interview"
        app.notes = (app.notes or "") + (
            f"\n[Auto-Graded] Cleared online assessment with {pct_score}% "
            f"(Threshold: {assessment.passing_score}%)."
        )

        interview_record = db.query(Interview).filter(Interview.application_id == app.id).first()
        sched_time = datetime.now(timezone.utc) + timedelta(days=2, hours=4)
        meet_link = f"https://meet.google.com/tiq-{app.id[:4]}-tech"
        interviewer = "Lead Systems Architect & Engineering Panel"

        if not interview_record:
            interview_record = Interview(
                application_id=app.id,
                interview_type="Technical",
                title=f"Technical Architecture & Code Evaluation: {app.job.title}",
                scheduled_at=sched_time,
                duration_minutes=45,
                meeting_link=meet_link,
                interviewer_name=interviewer,
                interviewer_email=(
                    app.job.creator.email
                    if (app.job and app.job.creator)
                    else "recruitment@talentiq.ai"
                ),
                status="scheduled",
                result="pending"
            )
            db.add(interview_record)
        else:
            sched_time = interview_record.scheduled_at
            meet_link = interview_record.meeting_link or meet_link
            interviewer = interview_record.interviewer_name or interviewer
    else:
        app.notes = (app.notes or "") + (
            f"\n[Auto-Graded] Scored {pct_score}% on assessment "
            f"(Required: {assessment.passing_score}%)."
        )

    db.commit()
    db.refresh(attempt)

    # If disqualified, do not dispatch interview invitations
    if not is_disqualified:
        background_tasks.add_task(
            _send_assessment_result_email,
            application_id=app.id,
            pct_score=pct_score,
            passed=passed,
            meet_link=meet_link,
            sched_time=sched_time,
            interviewer=interviewer,
            stage=email_stage,
            delay_seconds=120,
        )

    if is_disqualified:
        return {
            "attempt_id": attempt.id,
            "submitted": True,
            "disqualified": True,
            "termination_reason": submission.termination_reason or "Proctoring violation",
            "message": f"Assessment terminated by AI Proctoring System: {submission.termination_reason}."
        }

    return {
        "attempt_id": attempt.id,
        "submitted": True,
        "disqualified": False,
        "message": (
            "Your assessment has been submitted successfully! "
            "Our system will evaluate your responses and you will receive "
            "an email with your result within the next few minutes. "
            "Please keep an eye on your inbox."
        )
    }
