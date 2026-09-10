import re
from typing import Dict, List, Any
from app.models import Job, Candidate

class MatchingEngine:
    @classmethod
    def evaluate_candidate(cls, job: Job, candidate: Candidate) -> Dict[str, Any]:
        """
        Calculates an explainable match score (0-100) between a Job and Candidate.
        Formula:
          - Skill Score (50%)
          - Experience Score (20%)
          - Education Score (10%)
          - Semantic Alignment Score (20%)
        """
        candidate_skills = [s.strip().lower() for s in (candidate.parsed_skills or [])]
        req_skills = [s.strip().lower() for s in (job.required_skills or [])]
        pref_skills = [s.strip().lower() for s in (job.preferred_skills or [])]
        
        # 1. Skill Matching
        matched_req = [s for s in req_skills if cls._skill_matches(s, candidate_skills)]
        missing_req = [s for s in req_skills if s not in matched_req]
        
        matched_pref = [s for s in pref_skills if cls._skill_matches(s, candidate_skills)]
        missing_pref = [s for s in pref_skills if s not in matched_pref]
        
        if req_skills:
            req_score = (len(matched_req) / len(req_skills)) * 100.0
        else:
            req_score = 100.0
            
        if pref_skills:
            pref_score = (len(matched_pref) / len(pref_skills)) * 100.0
        else:
            pref_score = 100.0
            
        skill_score = round(req_score * 0.8 + pref_score * 0.2, 1)
        
        # 2. Experience Matching
        candidate_exp = candidate.total_experience_years or 0.0
        min_exp = job.min_experience or 0.0
        max_exp = job.max_experience or (min_exp + 5.0)
        
        if candidate_exp >= min_exp:
            if candidate_exp <= max_exp + 2.0:
                exp_score = 100.0
            else:
                # Slightly overqualified but still solid
                exp_score = 90.0
        else:
            # Under minimum experience
            ratio = candidate_exp / max(min_exp, 1.0)
            exp_score = round(max(30.0, ratio * 100.0), 1)
            
        # 3. Education Matching
        cand_deg = (candidate.degree or candidate.education or "Bachelor's Degree").lower()
        job_deg = (job.education or "Bachelor's Degree").lower()
        
        deg_weights = {
            "ph.d": 4,
            "master": 3,
            "bachelor": 2,
            "diploma": 1
        }
        
        cand_weight = 2
        for k, v in deg_weights.items():
            if k in cand_deg:
                cand_weight = v
                break
                
        job_weight = 2
        for k, v in deg_weights.items():
            if k in job_deg:
                job_weight = v
                break
                
        if cand_weight >= job_weight:
            education_score = 100.0
        else:
            education_score = 75.0
            
        # 4. Semantic / Contextual Alignment
        desc_text = f"{job.title} {job.description}".lower()
        cand_text = f"{candidate.raw_resume_text or ''} {' '.join(candidate.parsed_skills or [])}".lower()
        
        # Count contextual words
        desc_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", desc_text))
        stop_words = {"and", "the", "for", "with", "this", "that", "you", "will", "our", "team", "work"}
        keywords = desc_words - stop_words
        
        if keywords:
            hits = sum(1 for kw in keywords if kw in cand_text)
            semantic_ratio = min(1.0, hits / max(10, len(keywords) * 0.35))
            semantic_score = round(semantic_ratio * 100.0, 1)
        else:
            semantic_score = 85.0
            
        # Composite Final Score (50% + 20% + 10% + 20%)
        final_score = round(
            (skill_score * 0.50) +
            (exp_score * 0.20) +
            (education_score * 0.10) +
            (semantic_score * 0.20),
            1
        )
        final_score = max(10.0, min(99.5, final_score))
        
        # Build explainable rationale
        display_matched = [s.title() for s in (matched_req + matched_pref)]
        display_missing = [s.title() for s in (missing_req + missing_pref)]
        
        explanation = cls._generate_explanation(
            final_score,
            len(matched_req),
            len(req_skills),
            candidate_exp,
            min_exp,
            missing_req
        )
        
        return {
            "match_score": final_score,
            "skill_score": skill_score,
            "experience_score": exp_score,
            "education_score": education_score,
            "semantic_score": semantic_score,
            "matched_skills": sorted(list(set(display_matched))),
            "missing_skills": sorted(list(set(display_missing))),
            "score_explanation": explanation
        }

    @staticmethod
    def _skill_matches(target_skill: str, candidate_skills: List[str]) -> bool:
        t = target_skill.lower()
        for cs in candidate_skills:
            if t == cs or t in cs or cs in t:
                return True
        return False

    @staticmethod
    def _generate_explanation(score: float, matched_count: int, req_count: int, exp: float, min_exp: float, missing_req: List[str]) -> str:
        parts = []
        if score >= 85:
            parts.append(f"Outstanding candidate match ({score}%).")
        elif score >= 70:
            parts.append(f"Strong overall profile fit ({score}%).")
        elif score >= 50:
            parts.append(f"Moderate alignment with role requirements ({score}%).")
        else:
            parts.append(f"Low match score ({score}%).")
            
        if req_count > 0:
            parts.append(f"Candidate satisfies {matched_count} of {req_count} core technical requirements.")
            
        if exp >= min_exp:
            parts.append(f"Experience level ({exp:.1f} yrs) meets or exceeds target requirement of {min_exp:.1f} yrs.")
        else:
            parts.append(f"Experience level ({exp:.1f} yrs) is currently below preferred {min_exp:.1f} yrs.")
            
        if missing_req:
            disp_missing = ", ".join([m.title() for m in missing_req[:3]])
            parts.append(f"Key missing skills to verify: {disp_missing}.")
        else:
            parts.append("Candidate demonstrates full technical skill coverage.")
            
        return " ".join(parts)
