export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience: number;
  max_experience: number;
  education: string;
  location: string;
  employment_type: string;
  work_mode: string;
  deadline?: string;
  public_token: string;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
  updated_at: string;
  applicant_count?: number;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  education?: string;
  college?: string;
  degree?: string;
  graduation_year?: number;
  current_company?: string;
  total_experience_years: number;
  parsed_skills: string[];
  raw_resume_text?: string;
  resume_filename?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Assessment' | 'Technical Interview' | 'HR Interview' | 'Offer' | 'Hired' | 'Rejected';
  previous_stage?: string;
  match_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  semantic_score: number;
  matched_skills: string[];
  missing_skills: string[];
  score_explanation?: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  job?: Job;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_idx: number;
  points: number;
}

export interface Assessment {
  id: string;
  job_id: string;
  title: string;
  description?: string;
  time_limit_minutes: number;
  passing_score: number;
  questions: AssessmentQuestion[];
  is_active: boolean;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interview_type: 'Technical' | 'HR' | 'Final';
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link?: string;
  interviewer_name: string;
  interviewer_email?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  rating?: number;
  feedback?: string;
  result: 'pending' | 'passed' | 'failed';
  created_at: string;
}

export interface EmailLog {
  id: string;
  application_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  template_name: string;
  email_type?: string;
  body: string;
  status: string;
  sent_at: string;
}

export interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_applicants: number;
  hired_count: number;
  average_match_score: number;
  pipeline_funnel: Record<string, number>;
  recent_applications: Application[];
  top_skills_in_demand: { skill: string; count: number }[];
}
