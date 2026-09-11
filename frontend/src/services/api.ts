import { Job, Application, DashboardStats, Assessment, Interview, EmailLog } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  // --- Dashboard ---
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackDashboard();
    }
  },

  // --- Jobs ---
  async getJobs(): Promise<Job[]> {
    try {
      const res = await fetch(`${API_BASE}/jobs/`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackJobs();
    }
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    try {
      const res = await fetch(`${API_BASE}/jobs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const newJob: Job = {
        id: 'job-' + Date.now(),
        title: jobData.title || 'Untitled Job',
        department: jobData.department || 'Engineering',
        description: jobData.description || '',
        required_skills: jobData.required_skills || [],
        preferred_skills: jobData.preferred_skills || [],
        min_experience: jobData.min_experience || 2,
        max_experience: jobData.max_experience || 5,
        education: jobData.education || "Bachelor's Degree",
        location: jobData.location || 'Remote',
        employment_type: jobData.employment_type || 'Full-time',
        work_mode: jobData.work_mode || 'Remote',
        deadline: jobData.deadline,
        public_token: 'LINK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        applicant_count: 0,
      };
      return newJob;
    }
  },

  async toggleJobStatus(jobId: string): Promise<{ id: string; status: string }> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/toggle-status`, { method: 'POST' });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { id: jobId, status: 'toggled' };
    }
  },

  // --- Public Portal ---
  async getPublicJob(token: string): Promise<Job> {
    try {
      const res = await fetch(`${API_BASE}/public/apply/${token}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const jobs = getFallbackJobs();
      const found = jobs.find(j => j.public_token.toLowerCase() === token.toLowerCase() || j.id.toLowerCase() === token.toLowerCase());
      if (found) return found;
      throw new Error('Position not found');
    }
  },

  async submitPublicApplication(token: string, formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/public/apply/${token}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Submission failed' }));
      throw new Error(errorData.detail || 'Application submission failed');
    }
    return await res.json();
  },

  // --- Candidates & Pipeline ---
  async getApplications(jobId?: string, stage?: string, search?: string): Promise<Application[]> {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('job_id', jobId);
      if (stage) params.append('stage', stage);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/candidates/?${params.toString()}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackApplications(jobId, stage, search);
    }
  },

  async getApplicationDetail(applicationId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/candidates/application/${applicationId}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const apps = getFallbackApplications();
      const app = apps.find(a => a.id === applicationId) || apps[0];
      return {
        application: app,
        candidate: app.candidate,
        job: app.job,
        interviews: [],
        assessments: [],
        emails: [],
      };
    }
  },

  async updateStage(applicationId: string, stage: string, notes?: string): Promise<Application> {
    try {
      const res = await fetch(`${API_BASE}/pipeline/application/${applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, notes }),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const apps = getFallbackApplications();
      const app = apps.find(a => a.id === applicationId);
      if (app) {
        app.previous_stage = app.stage;
        app.stage = stage as any;
        return app;
      }
      throw new Error('Application not found');
    }
  },

  // --- Assessments & Interviews ---
  async getAllAssessments(): Promise<Assessment[]> {
    try {
      const res = await fetch(`${API_BASE}/assessments/all`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackAssessments();
    }
  },

  async getJobAssessments(jobId: string): Promise<Assessment[]> {
    try {
      const res = await fetch(`${API_BASE}/assessments/job/${jobId}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackAssessments();
    }
  },

  async createAssessment(data: Partial<Assessment>): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/assessments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create assessment');
    return await res.json();
  },

  async updateAssessment(assessmentId: string, data: Partial<Assessment>): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/assessments/${assessmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update assessment');
    return await res.json();
  },

  async generateQuestions(jobTitle: string, skills: string[] = [], count: number = 5): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/assessments/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: jobTitle, skills, count }),
      });
      if (!res.ok) throw new Error('Failed to generate questions');
      const data = await res.json();
      return data.questions || [];
    } catch (err) {
      console.error('Error generating questions:', err);
      return [];
    }
  },

  async getAssessmentStats(jobId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/assessments/stats/${jobId}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return {
        job_id: jobId,
        total_invited: 0,
        total_completed: 0,
        passed_count: 0,
        failed_count: 0,
        pass_rate: 0,
        avg_score: 0,
        passing_threshold: 70,
        recent_attempts: [],
      };
    }
  },

  async getCandidateAssessment(applicationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/assessments/application/${applicationId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load assessment' }));
      throw new Error(err.detail || 'Failed to load assessment');
    }
    return await res.json();
  },

  async resetCandidateAssessment(applicationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/assessments/application/${applicationId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset assessment');
    return await res.json();
  },

  async submitAssessment(
    applicationId: string,
    answers: Record<string, number>,
    metadata?: {
      is_disqualified?: boolean;
      termination_reason?: string;
      proctoring_violations?: number;
    }
  ): Promise<any> {
    try {
      const payload: any = {
        application_id: applicationId,
        answers,
        ...(metadata || {}),
      };
      const res = await fetch(`${API_BASE}/assessments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return {
        score: metadata?.is_disqualified ? 0.0 : 100.0,
        passed: !metadata?.is_disqualified,
        disqualified: metadata?.is_disqualified || false,
        termination_reason: metadata?.termination_reason,
      };
    }
  },

  async getInterviews(): Promise<Interview[]> {
    try {
      const res = await fetch(`${API_BASE}/interviews/`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackInterviews();
    }
  },

  async scheduleInterview(data: any): Promise<Interview> {
    try {
      const res = await fetch(`${API_BASE}/interviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return {
        id: 'int-' + Date.now(),
        application_id: data.application_id,
        interview_type: data.interview_type || 'Technical',
        title: data.title,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes || 45,
        meeting_link: 'https://meet.google.com/ats-demo-meet',
        interviewer_name: data.interviewer_name || 'Lead Interviewer',
        status: 'scheduled',
        result: 'pending',
        created_at: new Date().toISOString(),
      };
    }
  },

  async recordInterviewFeedback(interviewId: string, rating: number, feedback: string, result: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/interviews/${interviewId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, result }),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { id: interviewId, rating, feedback, result, status: 'completed' };
    }
  },

  async getEmailLogs(): Promise<EmailLog[]> {
    try {
      const res = await fetch(`${API_BASE}/emails/logs`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return getFallbackEmailLogs();
    }
  },
};

// ==================== Clean Fallback Dataset ====================

function getFallbackJobs(): Job[] {
  return [
    {
      id: 'job-1',
      title: 'Senior AI / Backend Engineer',
      department: 'AI & Platform Engineering',
      description: 'Architecting high-throughput microservices using Python & FastAPI, PostgreSQL, and integrating production LLM models.',
      required_skills: ['Python', 'FastAPI', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
      preferred_skills: ['PyTorch', 'NLP', 'LLM', 'Redis', 'AWS', 'Kubernetes'],
      min_experience: 3.0,
      max_experience: 8.0,
      education: "Bachelor's or Master's in Computer Science",
      location: 'San Francisco, CA / Remote',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      deadline: '2026-10-15T23:59:59Z',
      public_token: 'AI-BACKEND-8X9',
      status: 'active',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
      applicant_count: 0,
    },
    {
      id: 'job-2',
      title: 'Staff Frontend Architect',
      department: 'Product Experience',
      description: 'Craft mission-critical web applications with sub-millisecond response times, glassmorphic aesthetics, and bulletproof TypeScript.',
      required_skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'REST API'],
      preferred_skills: ['Next.js', 'GraphQL', 'Tailwind', 'Jest', 'Performance'],
      min_experience: 4.0,
      max_experience: 10.0,
      education: "Bachelor's Degree",
      location: 'New York, NY / Hybrid',
      employment_type: 'Full-time',
      work_mode: 'Hybrid',
      deadline: '2026-10-05T23:59:59Z',
      public_token: 'FRONTEND-ARC-42',
      status: 'active',
      created_at: '2026-09-02T11:00:00Z',
      updated_at: '2026-09-02T11:00:00Z',
      applicant_count: 0,
    },
    {
      id: 'job-3',
      title: 'Cloud DevOps & Infrastructure Lead',
      department: 'Core Infrastructure',
      description: 'Multi-region Kubernetes clusters, automated zero-downtime CI/CD pipelines, and secure cloud environments on AWS.',
      required_skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git'],
      preferred_skills: ['Terraform', 'Ansible', 'Python', 'Prometheus', 'Nginx'],
      min_experience: 3.5,
      max_experience: 9.0,
      education: "Bachelor's Degree",
      location: 'Austin, TX / Remote',
      employment_type: 'Full-time',
      work_mode: 'Remote',
      deadline: '2026-10-30T23:59:59Z',
      public_token: 'DEVOPS-LEAD-77',
      status: 'active',
      created_at: '2026-09-03T12:00:00Z',
      updated_at: '2026-09-03T12:00:00Z',
      applicant_count: 0,
    },
  ];
}

function getFallbackApplications(jobId?: string, stage?: string, search?: string): Application[] {
  return [];
}

function getFallbackDashboard(): DashboardStats {
  return {
    total_jobs: 3,
    active_jobs: 3,
    total_applicants: 0,
    hired_count: 0,
    average_match_score: 0.0,
    pipeline_funnel: {
      Applied: 0,
      Screening: 0,
      Shortlisted: 0,
      Assessment: 0,
      'Technical Interview': 0,
      'HR Interview': 0,
      Offer: 0,
      Hired: 0,
      Rejected: 0,
    },
    recent_applications: [],
    top_skills_in_demand: [
      { skill: 'Python', count: 1 },
      { skill: 'FastAPI', count: 1 },
      { skill: 'React', count: 1 },
      { skill: 'TypeScript', count: 1 },
      { skill: 'Docker', count: 1 },
      { skill: 'PostgreSQL', count: 1 },
      { skill: 'Kubernetes', count: 1 },
      { skill: 'AWS', count: 1 },
    ],
  };
}

function getFallbackAssessments(): Assessment[] {
  return [];
}

function getFallbackInterviews(): Interview[] {
  return [];
}

function getFallbackEmailLogs(): EmailLog[] {
  return [];
}
