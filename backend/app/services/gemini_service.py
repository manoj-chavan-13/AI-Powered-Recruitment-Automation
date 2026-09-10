import json
import time
import logging
import httpx
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.services.resume_parser import ResumeParser
from app.services.matching_service import MatchingEngine

logger = logging.getLogger("talentiq.gemini")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

class GeminiPostProcessor:
    """
    Google Gemini Post-Processor for TalentIQ ATS.
    Intelligently extracts candidate profiles, evaluates fit scores,
    synthesizes strengths & gaps, and drafts custom interview questions.
    """

    @classmethod
    def parse_resume_with_gemini(cls, raw_text: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Uses Google Gemini to parse extracted PDF resume text into clean, structured data.
        Falls back to rule-based ResumeParser if API key is missing or fails.
        """
        fallback_data = ResumeParser.parse_resume(raw_text, filename=filename)
        
        api_key = settings.GEMINI_API_KEY
        if not api_key or not raw_text or len(raw_text.strip()) < 30:
            return fallback_data

        prompt = f"""
You are the AI Talent Acquisition Engine for TalentIQ.
Analyze the following raw resume text extracted from an applicant's PDF ({filename or 'resume.pdf'}).

Extract and normalize the candidate's profile into valid JSON adhering strictly to this schema:
{{
  "full_name": "string (Candidate full name)",
  "email": "string (Candidate email or null)",
  "phone": "string (Candidate phone number or null)",
  "location": "string (City, State / Country or null)",
  "skills": ["string (Comprehensive list of technical and professional skills)"],
  "total_experience_years": float (Estimated total years of professional experience, e.g. 3.5),
  "degree": "string (Highest educational qualification, e.g. 'Bachelor of Science in Computer Science')",
  "college": "string (University or college name or null)",
  "current_company": "string (Most recent employer or company or null)",
  "candidate_summary": "string (2-3 sentence executive profile summary)",
  "key_highlights": ["string (Notable achievements, impact metrics, or projects)"]
}}

Raw Resume Text:
\"\"\"
{raw_text[:6000]}
\"\"\"
"""
        model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
        url = f"{GEMINI_API_URL}/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        try:
            with httpx.Client(timeout=18.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    parts = data["candidates"][0]["content"]["parts"]
                    text_content = parts[0]["text"]
                    parsed_json = json.loads(text_content)
                    
                    # Merge and ensure types
                    skills = parsed_json.get("skills") or fallback_data.get("skills", [])
                    exp = parsed_json.get("total_experience_years")
                    try:
                        exp_val = float(exp) if exp is not None else fallback_data.get("total_experience_years", 1.0)
                    except (ValueError, TypeError):
                        exp_val = fallback_data.get("total_experience_years", 1.0)

                    return {
                        "full_name": parsed_json.get("full_name") or None,
                        "email": parsed_json.get("email") or fallback_data.get("email"),
                        "phone": parsed_json.get("phone") or fallback_data.get("phone"),
                        "location": parsed_json.get("location") or None,
                        "skills": skills,
                        "total_experience_years": exp_val,
                        "degree": parsed_json.get("degree") or fallback_data.get("degree", "Bachelor's Degree"),
                        "college": parsed_json.get("college") or None,
                        "current_company": parsed_json.get("current_company") or None,
                        "candidate_summary": parsed_json.get("candidate_summary") or "",
                        "key_highlights": parsed_json.get("key_highlights") or [],
                        "raw_text": raw_text[:5000],
                        "resume_filename": filename or "resume.pdf",
                        "parsed_by": "gemini"
                    }
                else:
                    logger.warning(f"Gemini resume parsing returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.error(f"Gemini resume parsing error: {e}", exc_info=True)

        return fallback_data

    @classmethod
    def evaluate_match_with_gemini(
        cls,
        job: Any,
        candidate: Any,
        raw_resume_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses Google Gemini to evaluate candidate match against a specific job opening.
        Produces multi-dimensional scores, matched/missing skills, strengths, gaps,
        and targeted interview questions.
        """
        # Rule-based fallback baseline
        fallback_eval = MatchingEngine.evaluate_candidate(job, candidate)

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return fallback_eval

        skills_list = candidate.parsed_skills or []
        req_skills = job.required_skills or []
        pref_skills = job.preferred_skills or []
        resume_snippet = (raw_resume_text or candidate.raw_resume_text or "")[:4000]

        prompt = f"""
You are the Lead Talent Assessor for TalentIQ ATS.
Evaluate this candidate's application against the target job posting.

Target Job Opening:
- Title: {job.title}
- Department: {job.department or 'Engineering'}
- Description: {job.description}
- Required Skills: {json.dumps(req_skills)}
- Preferred Skills: {json.dumps(pref_skills)}
- Experience Needed: {job.min_experience} to {job.max_experience} years
- Target Education: {job.education or 'Bachelor'}
- Location: {job.location} ({job.work_mode})

Candidate Profile:
- Full Name: {candidate.full_name}
- Total Experience: {candidate.total_experience_years} years
- Education: {candidate.degree or candidate.education}
- College: {candidate.college or 'Not specified'}
- Current / Recent Company: {candidate.current_company or 'Not specified'}
- Identified Skills: {json.dumps(skills_list)}
- Resume Content Excerpt:
\"\"\"
{resume_snippet}
\"\"\"

Assess the candidate thoroughly and return a valid JSON matching this schema:
{{
  "match_score": float (Overall match score between 10.0 and 99.0, calibrated strictly on relevance),
  "skill_score": float (0.0 to 100.0, evaluating both required & preferred skill alignment),
  "experience_score": float (0.0 to 100.0, evaluating depth of tenure and relevance),
  "education_score": float (0.0 to 100.0, evaluating academic / degree background),
  "semantic_score": float (0.0 to 100.0, evaluating domain and context alignment),
  "matched_skills": ["string (Skills mentioned by candidate that directly satisfy job requirements)"],
  "missing_skills": ["string (Important job skills that the candidate appears to lack)"],
  "key_strengths": ["string (3 distinct strengths illustrating why candidate is a good hire)"],
  "potential_gaps": ["string (1 to 3 risks, gaps, or flags to investigate)"],
  "score_explanation": "string (2-4 sentence executive debrief for the hiring team)",
  "interview_questions": [
    {{
      "question": "string (Targeted interview question testing their gaps or claim)",
      "focus_area": "string (e.g. 'PostgreSQL Concurrency' or 'Microservice Scaling')",
      "look_for": "string (Key signals in candidate response)"
    }}
  ]
}}
"""
        model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
        url = f"{GEMINI_API_URL}/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        try:
            with httpx.Client(timeout=18.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    parts = data["candidates"][0]["content"]["parts"]
                    eval_json = json.loads(parts[0]["text"])

                    def clean_score(val, default):
                        try:
                            f = float(val)
                            return round(max(5.0, min(99.5, f)), 1)
                        except (ValueError, TypeError):
                            return default

                    match_score = clean_score(eval_json.get("match_score"), fallback_eval["match_score"])
                    skill_score = clean_score(eval_json.get("skill_score"), fallback_eval["skill_score"])
                    exp_score = clean_score(eval_json.get("experience_score"), fallback_eval["experience_score"])
                    edu_score = clean_score(eval_json.get("education_score"), fallback_eval["education_score"])
                    sem_score = clean_score(eval_json.get("semantic_score"), fallback_eval["semantic_score"])

                    matched = eval_json.get("matched_skills") or fallback_eval.get("matched_skills", [])
                    missing = eval_json.get("missing_skills") or fallback_eval.get("missing_skills", [])
                    explanation = eval_json.get("score_explanation") or fallback_eval.get("score_explanation", "")

                    return {
                        "match_score": match_score,
                        "skill_score": skill_score,
                        "experience_score": exp_score,
                        "education_score": edu_score,
                        "semantic_score": sem_score,
                        "matched_skills": [str(s).title() for s in matched],
                        "missing_skills": [str(s).title() for s in missing],
                        "score_explanation": explanation,
                        "key_strengths": eval_json.get("key_strengths", []),
                        "potential_gaps": eval_json.get("potential_gaps", []),
                        "interview_questions": eval_json.get("interview_questions", []),
                        "evaluated_by": "gemini"
                    }
                else:
                    logger.warning(f"Gemini evaluation returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.error(f"Gemini evaluation error: {e}", exc_info=True)

        return fallback_eval

    @classmethod
    def generate_assessment_questions(
        cls,
        job_title: str,
        required_skills: List[str],
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Uses Gemini to generate high-quality, real-world scenario multiple choice
        assessment questions tailored to a specific job role and technical skillset.
        Includes robust fallback if offline or API key is absent.
        """
        api_key = settings.GEMINI_API_KEY
        skills_str = ", ".join(required_skills) if required_skills else "General software engineering and problem-solving"

        fallback_pool = [
            {
                "id": f"gen_q1_{int(time.time() if 'time' in dir() else 1000)}",
                "question": f"In production systems for {job_title}, what is the most reliable strategy to ensure zero-downtime rollouts?",
                "category": "Architecture & Operations",
                "options": [
                    "Blue/Green or Canary deployment with automated health checks and instant traffic rollback",
                    "Single-instance in-place hot patching during off-peak hours",
                    "Forcing all active WebSocket connections to disconnect immediately",
                    "Deploying updates without running migrations"
                ],
                "correct_idx": 0,
                "points": 20,
                "explanation": "Blue/Green and Canary deployments maintain parallel environments and verify operational metrics before routing 100% of user traffic."
            },
            {
                "id": f"gen_q2_{int(time.time() if 'time' in dir() else 1001)}",
                "question": f"When optimizing latency for systems using {skills_str.split(',')[0] if skills_str else 'core technologies'}, which approach yields the most dramatic reduction in P99 response times?",
                "category": "Performance & Scalability",
                "options": [
                    "Increasing the client-side timeout threshold to 60 seconds",
                    "Implementing distributed caching with Redis, query index optimization, and asynchronous non-blocking I/O",
                    "Disabling database connection pooling to establish fresh connections per request",
                    "Compressing network payloads with gzip only on synchronous endpoints"
                ],
                "correct_idx": 1,
                "points": 20,
                "explanation": "Distributed multi-layer caching, index tuning, and asynchronous non-blocking I/O prevent resource contention and slash tail latency."
            },
            {
                "id": f"gen_q3_{int(time.time() if 'time' in dir() else 1002)}",
                "question": "Which design pattern is best suited to handle intermittent downstream API failures without cascading failure across microservices?",
                "category": "Reliability & Fault Tolerance",
                "options": [
                    "Circuit Breaker pattern with exponential backoff and fallback responses",
                    "Infinite immediate retry loop",
                    "Synchronous blocking HTTP calls",
                    "Dropping all incoming traffic until downstream recovers"
                ],
                "correct_idx": 0,
                "points": 20,
                "explanation": "Circuit Breakers trip open upon repeated failures, protecting the service and giving downstream dependencies time to heal."
            },
            {
                "id": f"gen_q4_{int(time.time() if 'time' in dir() else 1003)}",
                "question": "In a distributed transactional workflow across distinct microservices, how is eventual consistency most cleanly achieved?",
                "category": "Distributed Systems",
                "options": [
                    "Saga Pattern (orchestrated or choreographed) with compensating transactions and transactional outbox",
                    "Distributed 2-Phase Commit (2PC) over public internet",
                    "Direct cross-service database table joins",
                    "Ignoring failed intermediate operations"
                ],
                "correct_idx": 0,
                "points": 20,
                "explanation": "Sagas decompose transactions into local steps paired with compensating actions for failures, preserving microservice isolation."
            },
            {
                "id": f"gen_q5_{int(time.time() if 'time' in dir() else 1004)}",
                "question": "From a security standpoint, what is the best practice for authenticating and authorizing service-to-service communications?",
                "category": "Security & Identity",
                "options": [
                    "Hardcoded API secrets in shared environment variables across all containers",
                    "Mutual TLS (mTLS) with short-lived cryptographically signed JWT/SPIFFE tokens and least-privilege RBAC",
                    "Whitelisting only public IP addresses without transport encryption",
                    "Allowing all internal VPC subnet traffic unauthenticated"
                ],
                "correct_idx": 1,
                "points": 20,
                "explanation": "mTLS guarantees mutual cryptographic identity and encryption, while signed tokens enforce fine-grained authorization."
            }
        ]

        if not api_key:
            return fallback_pool[:count]

        prompt = f"""
You are the Chief Technical Recruiter and Assessment Designer for TalentIQ.
Create {count} professional, rigorous, multiple-choice technical assessment questions for candidates applying for the role of:
Role: {job_title}
Key Required Skills: {skills_str}

Guidelines:
1. Questions should test practical, real-world architectural scenarios, edge-cases, best practices, and problem-solving.
2. Avoid purely trivial definition questions. Focus on "How would you solve...", "Which trade-off applies...", "What is the primary advantage of...".
3. Provide exactly 4 options per question.
4. Mark the correct option with its zero-based index (0, 1, 2, or 3).
5. Ensure options are realistic and plausible.
6. Provide a concise explanation (1-2 sentences) why the correct answer is right.
7. Tag each question with a technical category (e.g., "System Design", "Concurrency", "DevOps", "Database", "Security").

Respond strictly in valid JSON matching this schema:
{{
  "questions": [
    {{
      "id": "q1",
      "question": "Clear scenario-based question text",
      "category": "Category name",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct_idx": 0,
      "points": 20,
      "explanation": "Clear explanation of correct answer."
    }}
  ]
}}
"""
        model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
        url = f"{GEMINI_API_URL}/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.3
            }
        }

        try:
            with httpx.Client(timeout=22.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    parts = data["candidates"][0]["content"]["parts"]
                    parsed = json.loads(parts[0]["text"])
                    questions = parsed.get("questions", [])
                    if questions and len(questions) > 0:
                        # Clean IDs and point distributions
                        import uuid
                        cleaned = []
                        for i, q in enumerate(questions[:count]):
                            cleaned.append({
                                "id": f"ai_q_{uuid.uuid4().hex[:8]}",
                                "question": q.get("question", ""),
                                "category": q.get("category", "Technical Knowledge"),
                                "options": q.get("options", []),
                                "correct_idx": int(q.get("correct_idx", 0)),
                                "points": int(q.get("points", 20)),
                                "explanation": q.get("explanation", "")
                            })
                        return cleaned
                else:
                    logger.warning(f"Gemini question generation status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}", exc_info=True)

        return fallback_pool[:count]

