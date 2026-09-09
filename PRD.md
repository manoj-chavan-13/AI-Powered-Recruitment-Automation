# 📋 PRD — AI Recruitment & Applicant Tracking System

## **End-to-End AI-Powered Recruitment Automation Platform**

**Project Type:** Full-stack SaaS / AI Recruitment Platform
**Primary Users:** Recruiters / HR / Admin
**Architecture:** Modular Monolith → Microservices-ready
**Frontend:** React + TypeScript + Tailwind CSS
**Backend:** Python + FastAPI
**Database:** PostgreSQL
**AI/NLP:** Python + spaCy + embeddings/LLM where appropriate
**Storage:** Local Storage for development → AWS S3
**Authentication:** JWT + Role-Based Access Control
**Integrations:** Email + Calendar + Assessment System
**Deployment:** Docker + Render/Railway/AWS
**API:** REST + OpenAPI/Swagger

---

# 1. Executive Summary

The **AI Recruitment & Applicant Tracking System (ATS)** is a web-based recruitment automation platform that manages the complete hiring lifecycle from **job creation to candidate onboarding**.

The recruiter creates a job opening and the system automatically generates a **public application form and unique application link** with an expiry date.

The recruiter can share this link through:

* Email
* LinkedIn
* Company website
* Social media
* QR code
* Direct messaging

Candidates open the link, submit their details, and upload their resume.

The system then automatically:

1. Receives the application.
2. Validates the application link.
3. Stores candidate information.
4. Stores the resume.
5. Extracts text from the resume.
6. Extracts skills, education and experience.
7. Compares the candidate against job requirements.
8. Generates an explainable match score.
9. Ranks candidates.
10. Places candidates into the recruitment pipeline.
11. Allows recruiter review.
12. Sends automated emails.
13. Sends assessments.
14. Tracks assessment completion.
15. Evaluates objective assessment results.
16. Moves qualified candidates to technical interviews.
17. Schedules interviews.
18. Sends interview invitations.
19. Records interview results.
20. Moves successful candidates to HR interviews.
21. Performs final selection.
22. Sends offer/welcome/onboarding communication.
23. Tracks the complete recruitment lifecycle.

The platform therefore becomes more than a CRUD ATS—it is an **AI-assisted recruitment workflow automation system**.

---

# 2. Problem Statement

Traditional recruitment involves multiple disconnected activities:

```text
Job Creation
     ↓
Collect Resumes
     ↓
Manually Read Resumes
     ↓
Shortlist
     ↓
Send Emails
     ↓
Send Assessment
     ↓
Check Assessment
     ↓
Schedule Interview
     ↓
Conduct Interview
     ↓
Send More Emails
     ↓
HR Interview
     ↓
Final Selection
     ↓
Onboarding
```

This process can become difficult to manage when hundreds of candidates apply.

The proposed system centralizes these activities into one platform.

---

# 3. Product Vision

### Vision

> **Build an intelligent recruitment platform that reduces repetitive recruiter work while keeping hiring decisions transparent and recruiter-controlled.**

The system should help recruiters answer:

* Which candidates applied?
* Which candidates match this job?
* Why do they match?
* Which candidates should be reviewed first?
* Who passed screening?
* Who completed the assessment?
* Who passed the assessment?
* Who needs a technical interview?
* Which interviews are scheduled?
* Who passed HR?
* Who was hired?
* What happened to every candidate?

---

# 4. Product Goals

## Primary Goals

### G1 — Job Management

Recruiters should be able to:

* Create jobs.
* Edit jobs.
* Publish jobs.
* Close jobs.
* Set application deadlines.
* Define required skills.
* Define preferred skills.
* Define experience requirements.
* Define education requirements.
* Define location/work mode.
* Generate application links.

---

### G2 — Public Candidate Application

Every published job gets a unique application URL.

Example:

```text
https://yourats.com/apply/8XK92AB7
```

The link contains:

```text
Job ID
Public Token
Expiry Date
Status
```

Candidates don't need recruiter accounts to apply.

---

### G3 — Automated Resume Processing

When a candidate uploads a resume:

```text
PDF
 ↓
Text Extraction
 ↓
Cleaning
 ↓
NLP Processing
 ↓
Skill Extraction
 ↓
Education Extraction
 ↓
Experience Extraction
 ↓
Candidate Profile
```

---

### G4 — AI Matching

The system compares:

```text
JOB REQUIREMENTS
        +
CANDIDATE PROFILE
        ↓
MATCHING ENGINE
        ↓
MATCH SCORE
```

Example:

```text
Match Score: 91/100

Matched:
✓ Python
✓ FastAPI
✓ PostgreSQL
✓ REST APIs
✓ Git

Missing:
✗ Docker

Experience:
✓ 2.5 years

Explanation:
Strong backend/API alignment with most
required technical skills.
```

---

### G5 — Candidate Ranking

Candidates for a particular job should be rankable.

Example:

| Rank | Candidate   | Match |
| ---: | ----------- | ----: |
|    1 | Candidate A |    94 |
|    2 | Candidate B |    91 |
|    3 | Candidate C |    88 |
|    4 | Candidate D |    85 |
|    5 | Candidate E |    82 |

Ranking should be **assistive**, not an automatic employment decision.

---

# 5. Target Users

## 5.1 Recruiter

Main user.

Can:

* Create jobs.
* Manage candidates.
* Review AI results.
* Move candidates through stages.
* Send emails.
* Schedule interviews.
* View dashboards.
* Make final decisions.

---

## 5.2 Admin

Can:

* Manage recruiters.
* Manage system settings.
* View all jobs.
* View system analytics.
* Configure integrations.

---

## 5.3 Candidate

Candidate functionality can initially remain public.

Candidate can:

* Open job link.
* View job.
* Fill application.
* Upload resume.
* Submit application.
* Receive emails.
* Open assessment.
* Attend interview.
* Receive final result.

---

# 6. Complete Recruitment Lifecycle

The complete lifecycle is:

```text
                 JOB CREATION
                      ↓
             APPLICATION LINK
                      ↓
                 JOB POSTED
                      ↓
              CANDIDATE APPLIES
                      ↓
             RESUME UPLOADED
                      ↓
             RESUME PROCESSING
                      ↓
              AI MATCHING
                      ↓
             CANDIDATE RANKING
                      ↓
                 SCREENING
                 /       \
              Reject    Shortlist
                         ↓
                    ASSESSMENT
                         ↓
                  AUTO EVALUATION
                    /         \
                 Fail         Pass
                  ↓             ↓
               Reject     TECHNICAL INTERVIEW
                               ↓
                         EVALUATION
                         /         \
                      Fail         Pass
                       ↓             ↓
                    Reject       HR INTERVIEW
                                    ↓
                               EVALUATION
                               /       \
                            Fail       Pass
                             ↓           ↓
                          Reject       HIRED
                                        ↓
                                  OFFER LETTER
                                        ↓
                                   ONBOARDING
```

---

# 7. System Architecture

## High-Level Architecture

```text
                       ┌─────────────────────┐
                       │      CANDIDATE      │
                       │   Public Browser    │
                       └──────────┬──────────┘
                                  │
                                  │ HTTPS
                                  ▼
                       ┌─────────────────────┐
                       │    REACT FRONTEND   │
                       │                     │
                       │ Public Application │
                       │ Recruiter Dashboard│
                       │ Candidate Profile  │
                       │ Job Management     │
                       └──────────┬──────────┘
                                  │
                              REST API
                                  │
                                  ▼
                ┌────────────────────────────────┐
                │         FASTAPI BACKEND        │
                │                                │
                │ Authentication                 │
                │ Job Management                │
                │ Application Management         │
                │ Candidate Management           │
                │ Resume Processing              │
                │ AI Matching                    │
                │ Ranking                        │
                │ Assessment                     │
                │ Interview Scheduling           │
                │ Email Automation               │
                │ Pipeline Management             │
                │ Analytics                      │
                └───────┬─────────┬──────────────┘
                        │         │
             ┌──────────┘         └─────────────┐
             ▼                                  ▼
      ┌──────────────┐                   ┌──────────────┐
      │ PostgreSQL   │                   │ File Storage │
      │              │                   │              │
      │ Jobs         │                   │ Resumes      │
      │ Candidates   │                   │ Documents    │
      │ Applications │                   │ Attachments  │
      │ Assessments  │                   └──────────────┘
      │ Interviews   │
      │ Emails       │
      └──────────────┘
             │
             ▼
      ┌───────────────────────┐
      │    AI/NLP ENGINE      │
      │                       │
      │ PDF Parsing           │
      │ Skill Extraction      │
      │ NLP                   │
      │ Embeddings            │
      │ Matching              │
      │ Ranking               │
      └───────────────────────┘
             │
             ▼
      ┌───────────────────────┐
      │  AUTOMATION ENGINE    │
      │                       │
      │ Stage Transitions     │
      │ Email Triggers        │
      │ Assessment Triggers   │
      │ Interview Triggers    │
      │ Deadline Handling     │
      └───────┬───────┬───────┘
              │       │
              ▼       ▼
           EMAIL    CALENDAR
           SERVICE   SERVICE
```

---

# 8. Module Architecture

Backend should be divided into logical modules.

```text
backend/
│
├── app/
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── jobs.py
│   │   ├── candidates.py
│   │   ├── applications.py
│   │   ├── assessments.py
│   │   ├── interviews.py
│   │   ├── dashboard.py
│   │   └── public.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── job.py
│   │   ├── candidate.py
│   │   ├── application.py
│   │   ├── assessment.py
│   │   ├── interview.py
│   │   ├── email.py
│   │   └── audit.py
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── job_service.py
│   │   ├── resume_parser.py
│   │   ├── matching_service.py
│   │   ├── ranking_service.py
│   │   ├── assessment_service.py
│   │   ├── interview_service.py
│   │   ├── email_service.py
│   │   └── automation_service.py
│   │
│   ├── utils/
│   │
│   └── main.py
│
└── tests/
```

---

# 9. Job Management

Recruiter creates:

```text
Job Title
Job Description
Required Skills
Preferred Skills
Minimum Experience
Education
Location
Employment Type
Work Mode
Application Deadline
Assessment
Interview Process
```

Example:

```text
Title:
Software Engineer

Required Skills:
Python
FastAPI
SQL
PostgreSQL
REST API

Experience:
0–2 years

Location:
Mumbai / Remote

Deadline:
30 September 2026
```

---

# 10. Automatic Application Form Generation

After creating a job:

```text
Create Job
    ↓
Save Job
    ↓
Generate Form
    ↓
Generate Unique Token
    ↓
Generate Public URL
    ↓
Set Expiry Date
```

Example:

```text
Job:
Software Engineer

Application URL:
https://ats.com/apply/ABC123XYZ

Expires:
30 September 2026
11:59 PM
```

---

# 11. Application Link Security

When candidate opens:

```text
GET /public/apply/{token}
```

Backend checks:

```text
Does token exist?
       ↓
Is job active?
       ↓
Is current date < expiry?
       ↓
Is application still open?
```

If yes:

```text
SHOW APPLICATION FORM
```

Otherwise:

```text
APPLICATION CLOSED

This job is no longer accepting applications.
```

---

# 12. Candidate Application Form

Form fields:

```text
Full Name *
Email *
Phone *
Date of Birth        [optional]
Location
Education *
College
Degree
Graduation Year
Experience
Current Company
Skills
LinkedIn
GitHub
Portfolio
Resume *
```

The recruiter can configure which fields are required.

---

# 13. Application Submission

Candidate clicks:

**Submit Application**

Backend:

```text
Validate Input
       ↓
Validate Email
       ↓
Validate Resume
       ↓
Check Job Status
       ↓
Check Deadline
       ↓
Create Candidate
       ↓
Create Application
       ↓
Store Resume
       ↓
Trigger Processing
       ↓
Send Confirmation Email
```

Candidate receives:

> Your application has been successfully received.

---

# 14. Resume Processing Pipeline

```text
Resume PDF
    ↓
File Validation
    ↓
PDF Text Extraction
    ↓
Text Cleaning
    ↓
NLP Processing
    ↓
Skill Extraction
    ↓
Education Extraction
    ↓
Experience Extraction
    ↓
Project Extraction
    ↓
Candidate Profile
```

Possible technologies:

* PyPDF2 / pypdf
* pdfplumber
* spaCy
* regex
* keyword dictionaries
* embeddings

---

# 15. Candidate Profile

Parsed candidate:

```text
Candidate
──────────────

Name:
Manoj Chavan

Skills:
Python
FastAPI
React
PostgreSQL
Git

Education:
B.E. Information Technology

Experience:
2 years

Projects:
ATS
Deepfake Detection

Resume:
resume.pdf
```

---

# 16. AI Matching Engine

The matching engine receives:

```text
JOB
 +
CANDIDATE PROFILE
```

and produces:

```text
Match Score
Matched Skills
Missing Skills
Experience Match
Education Match
Semantic Similarity
Explanation
```

---

# 17. Recommended Matching Algorithm

For the first version, use a transparent hybrid approach.

Example:

```text
Skill Match             50%
Experience Match        20%
Education Match         10%
Semantic Similarity     20%
```

Example:

```text
Skill Score = 92
Experience = 80
Education = 100
Semantic = 85
```

Then:

```text
Final Score =
(92 × 0.50)
+
(80 × 0.20)
+
(100 × 0.10)
+
(85 × 0.20)
```

This produces a reproducible score.

The original project specification also recommends a transparent matching method based on normalized skill overlap with optional semantic similarity and explicit matched/missing evidence. 

---

# 18. Candidate Ranking

After calculating scores:

```text
Candidate A → 94
Candidate B → 91
Candidate C → 87
Candidate D → 83
Candidate E → 79
```

Database query:

```text
ORDER BY match_score DESC
```

Recruiter sees:

```text
TOP MATCHED CANDIDATES

#1 Candidate A     94%
#2 Candidate B     91%
#3 Candidate C     87%
#4 Candidate D     83%
#5 Candidate E     79%
```

---

# 19. Explainable AI

Never show only:

```text
Score = 91
```

Instead:

```text
91/100

Matched:
✓ Python
✓ FastAPI
✓ PostgreSQL
✓ REST APIs

Missing:
✗ Docker

Experience:
✓ Meets requirement

Explanation:
Candidate demonstrates strong alignment
with the required backend technologies.
```

This makes the AI feature much easier to defend in an interview.

---

# 20. Recruitment Pipeline

The complete pipeline:

```text
APPLIED
   ↓
SCREENING
   ↓
SHORTLISTED
   ↓
ASSESSMENT
   ↓
TECHNICAL INTERVIEW
   ↓
HR INTERVIEW
   ↓
FINAL REVIEW
   ↓
SELECTED
   ↓
ONBOARDING
```

Every stage should have:

```text
Stage
Entered At
Exited At
Changed By
Reason
Notes
Status
```

---

# 21. Screening Stage

Candidates initially appear as:

```text
Applied
```

System calculates:

```text
AI Match Score
```

Recruiter can:

```text
[Shortlist]
[Reject]
[Review]
```

### If rejected

```text
Status → Rejected

Trigger:
Rejection Email
```

### If shortlisted

```text
Status → Shortlisted

Trigger:
Shortlist Email
```

---

# 22. Assessment Module

For shortlisted candidates:

```text
Shortlisted
      ↓
Create Assessment Attempt
      ↓
Generate Secure Assessment Link
      ↓
Send Email
```

Example:

```text
https://ats.com/test/X82J92K
```

Assessment can contain:

* MCQ
* Multiple-answer
* Coding questions
* Aptitude
* Technical questions

---

# 23. Assessment Tracking

System stores:

```text
Assessment ID
Candidate ID
Application ID
Start Time
Submission Time
Status
Score
Maximum Score
Pass Mark
```

Statuses:

```text
NOT_STARTED
STARTED
SUBMITTED
EVALUATED
PASSED
FAILED
EXPIRED
```

---

# 24. Assessment Automation

```text
Assessment Sent
       ↓
Candidate Opens?
   /          \
 No            Yes
 │              │
Reminder      Start
 │              │
              Submit
                ↓
            Evaluation
                ↓
             Passed?
            /       \
          No         Yes
          ↓           ↓
       Reject     Technical
                    Interview
```

For objective questions, evaluation can be automatic.

For coding questions, use a controlled execution/sandbox approach if you later implement automated code evaluation.

---

# 25. Technical Interview

When assessment is passed:

```text
Assessment Passed
        ↓
Technical Interview Required
        ↓
Find Interview Slot
        ↓
Schedule
        ↓
Send Calendar Invite
        ↓
Candidate Attends
        ↓
Interviewer Gives Feedback
        ↓
Technical Result
```

---

# 26. Interview Scheduling

Interview entity:

```text
Interview
──────────────
id
application_id
type
interviewer
scheduled_at
duration
meeting_link
status
feedback
score
created_at
```

Interview types:

```text
TECHNICAL
HR
MANAGERIAL
FINAL
```

---

# 27. Calendar Integration

Possible integration:

**Google Calendar API**

Workflow:

```text
Recruiter selects slot
       ↓
Backend
       ↓
Google Calendar API
       ↓
Create Event
       ↓
Meeting Link
       ↓
Send Candidate Invitation
```

---

# 28. Technical Interview Result

Interviewer dashboard:

```text
Candidate: XYZ

Technical Skills       8/10
Problem Solving        9/10
Communication          8/10
System Design          7/10

Overall: 8.0/10

[PASS]
[FAIL]
```

If failed:

```text
Rejected
 ↓
Send Rejection Email
```

If passed:

```text
HR Interview
```

---

# 29. HR Interview

Workflow:

```text
Technical Passed
       ↓
Schedule HR Interview
       ↓
Send HR Email
       ↓
Candidate Attends
       ↓
HR Evaluation
       ↓
Final Decision
```

HR can record:

```text
Communication
Culture/role fit
Availability
Salary expectations
Notice period
Overall feedback
```

---

# 30. Final Selection

If successful:

```text
HR Passed
   ↓
Final Review
   ↓
Selected
```

Then:

```text
Generate Offer
      ↓
Send Offer Email
      ↓
Candidate Accepts
      ↓
Send Welcome Email
      ↓
Onboarding
```

---

# 31. Email Automation System

This should be a separate backend service.

Possible provider:

```text
SendGrid
SMTP
Amazon SES
```

Email events:

```text
APPLICATION_RECEIVED
SHORTLISTED
REJECTED
ASSESSMENT_INVITATION
ASSESSMENT_REMINDER
ASSESSMENT_RESULT
TECHNICAL_INTERVIEW_INVITATION
TECHNICAL_INTERVIEW_RESULT
HR_INTERVIEW_INVITATION
HR_RESULT
OFFER
WELCOME
ONBOARDING
```

---

# 32. Email Template System

Recruiter/admin should eventually be able to customize templates.

Example:

```text
Subject:
Congratulations! You have been shortlisted.

Hello {{candidate_name}},

We are pleased to inform you that your application
for {{job_title}} has been shortlisted.

Next step:
{{next_step}}

Assessment Link:
{{assessment_link}}

Regards,
{{company_name}}
```

Use variables:

```text
{{candidate_name}}
{{job_title}}
{{assessment_link}}
{{interview_date}}
{{meeting_link}}
{{company_name}}
```

---

# 33. Automation Engine

This is one of the most important modules.

Instead of hardcoding every workflow into controllers:

```text
Application Created
       ↓
EVENT
       ↓
Automation Engine
       ↓
Find Rules
       ↓
Execute Actions
```

Example:

```text
EVENT:
AssessmentPassed

RULE:
if assessment.score >= passing_score

ACTION:
move application → TECHNICAL_INTERVIEW

ACTION:
send technical interview invitation
```

---

# 34. Event-Driven Workflow

Example:

```text
CandidateSubmitted
        ↓
ResumeParsed
        ↓
MatchCalculated
        ↓
CandidateRanked
        ↓
RecruiterShortlisted
        ↓
AssessmentCreated
        ↓
AssessmentSent
        ↓
AssessmentSubmitted
        ↓
AssessmentEvaluated
        ↓
AssessmentPassed
        ↓
TechnicalInterviewScheduled
        ↓
TechnicalInterviewCompleted
        ↓
TechnicalInterviewPassed
        ↓
HRInterviewScheduled
        ↓
HRInterviewCompleted
        ↓
CandidateSelected
        ↓
OfferSent
        ↓
OfferAccepted
        ↓
OnboardingStarted
```

---

# 35. Dashboard Architecture

## Overall Dashboard

```text
TOTAL JOBS
12

TOTAL APPLICANTS
248

IN PROCESS
86

HIRED
24
```

Additional metrics:

* Applications today
* Applications this week
* Open jobs
* Closed jobs
* Average match score
* Candidates in assessment
* Interviews scheduled
* Candidates hired

---

# 36. Job Dashboard

For every individual job:

```text
Software Engineer

Applications        248
Screening            86
Shortlisted          42
Assessment           32
Technical            18
HR                    8
Selected              5
Hired                 2
```

---

# 37. Candidate Dashboard

Candidate profile:

```text
Candidate Information

Name
Email
Phone
Education
Experience
Resume

AI MATCH
91/100

Matched Skills
Missing Skills
Explanation

Pipeline:
✓ Applied
✓ Screening
✓ Shortlisted
✓ Assessment
→ Technical Interview
○ HR
○ Selected
```

---

# 38. Candidate Timeline

Very useful feature:

```text
10 Sept
Application Submitted
        ↓
10 Sept
Resume Parsed
        ↓
10 Sept
AI Score Generated — 91
        ↓
11 Sept
Shortlisted
        ↓
11 Sept
Assessment Sent
        ↓
12 Sept
Assessment Completed
        ↓
12 Sept
Assessment Passed — 84%
        ↓
13 Sept
Technical Interview
        ↓
13 Sept
Technical Passed
        ↓
15 Sept
HR Interview
```

This gives recruiters a complete audit trail.

---

# 39. Database Design

Core entities:

```text
users
jobs
application_links
candidates
applications
resumes
candidate_skills
job_skills
match_results
assessments
assessment_questions
assessment_attempts
assessment_answers
interviews
interview_feedback
email_templates
email_logs
notifications
pipeline_events
audit_logs
```

---

# 40. Main Relationships

```text
USER
 │
 └──────< JOB
             │
             └──────< APPLICATION
                         │
                         └────── CANDIDATE
                         │
                         ├────── MATCH RESULT
                         │
                         ├────── ASSESSMENT
                         │
                         ├────── INTERVIEW
                         │
                         └────── PIPELINE EVENTS
```

---

# 41. Job Table

```text
jobs

id
title
description
required_skills
preferred_skills
experience_min
experience_max
education
location
employment_type
work_mode
status
application_deadline
created_by
created_at
updated_at
```

---

# 42. Candidate Table

```text
candidates

id
name
email
phone
location
education
experience_years
resume_url
parsed_text
skills
created_at
updated_at
```

---

# 43. Application Table

```text
applications

id
candidate_id
job_id
stage
status
match_score
applied_at
updated_at
```

---

# 44. Match Result Table

```text
match_results

id
application_id
overall_score
skill_score
experience_score
education_score
semantic_score
matched_skills
missing_skills
explanation
created_at
```

---

# 45. Assessment Tables

```text
assessments

id
job_id
title
duration
passing_score
status
created_at
```

```text
assessment_attempts

id
assessment_id
candidate_id
started_at
submitted_at
score
status
```

---

# 46. Interview Tables

```text
interviews

id
application_id
type
interviewer_id
scheduled_at
duration
meeting_link
status
result
feedback
created_at
```

---

# 47. Email Log

Every email should be logged.

```text
email_logs

id
candidate_id
application_id
template
recipient
subject
status
sent_at
provider_message_id
```

Statuses:

```text
QUEUED
SENT
DELIVERED
FAILED
```

---

# 48. Audit Log

Important for a recruitment system.

```text
audit_logs

id
user_id
entity_type
entity_id
action
old_value
new_value
timestamp
```

Example:

```text
Recruiter changed:

Stage:
SCREENING

→

SHORTLISTED
```

---

# 49. REST API

Original MVP APIs cover authentication, jobs, candidates, applications, stage changes, matching and dashboard summary. 

For the expanded system, extend them to:

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Jobs

```http
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/{id}
PUT    /api/jobs/{id}
DELETE /api/jobs/{id}
POST   /api/jobs/{id}/publish
POST   /api/jobs/{id}/close
```

### Public Application

```http
GET  /api/public/jobs/{token}
POST /api/public/jobs/{token}/apply
```

### Candidates

```http
GET  /api/candidates
GET  /api/candidates/{id}
POST /api/candidates
PUT  /api/candidates/{id}
```

### Resume

```http
POST /api/candidates/{id}/resume
GET  /api/candidates/{id}/resume
POST /api/candidates/{id}/parse
```

### Applications

```http
GET   /api/applications
POST  /api/applications
GET   /api/applications/{id}
PATCH /api/applications/{id}/stage
```

### Matching

```http
POST /api/applications/{id}/match
GET  /api/applications/{id}/match
```

### Ranking

```http
GET /api/jobs/{id}/rankings
```

### Assessments

```http
POST /api/assessments
GET  /api/assessments/{id}
POST /api/assessments/{id}/send
POST /api/assessments/{id}/attempt
POST /api/attempts/{id}/submit
GET  /api/attempts/{id}/result
```

### Interviews

```http
POST /api/interviews
GET  /api/interviews
PUT  /api/interviews/{id}
POST /api/interviews/{id}/result
```

### Emails

```http
POST /api/emails/send
GET  /api/emails/logs
```

### Dashboard

```http
GET /api/dashboard/summary
GET /api/dashboard/jobs/{id}
GET /api/dashboard/pipeline
GET /api/dashboard/analytics
```

---

# 50. Frontend Pages

```text
/login
/register

/dashboard

/jobs
/jobs/create
/jobs/:id
/jobs/:id/edit
/jobs/:id/candidates
/jobs/:id/ranking

/candidates
/candidates/:id

/applications/:id

/assessments
/assessments/:id

/interviews
/interviews/calendar

/emails
/settings

/public/apply/:token
/public/assessment/:token
```

---

# 51. Recruiter UI

Main navigation:

```text
Dashboard
Jobs
Candidates
Applications
Assessments
Interviews
Analytics
Emails
Settings
```

---

# 52. Job Page

```text
Software Engineer
────────────────────────────

Status: OPEN
Applications: 248
Deadline: 30 Sept

[Edit] [Close Job] [Copy Link]

Application Link:
https://ats.com/apply/ABC123

[Copy Link]
[QR Code]

────────────────────────────

Candidates
```

---

# 53. Ranking UI

```text
AI Candidate Ranking

┌────┬──────────────┬───────┬──────────────┐
│ #  │ Candidate    │ Match │ Stage        │
├────┼──────────────┼───────┼──────────────┤
│ 1  │ Candidate A  │ 94%   │ Shortlisted  │
│ 2  │ Candidate B  │ 91%   │ Assessment   │
│ 3  │ Candidate C  │ 88%   │ Screening    │
│ 4  │ Candidate D  │ 84%   │ Applied      │
└────┴──────────────┴───────┴──────────────┘
```

Filters:

```text
Match Score
Skills
Experience
Education
Stage
Assessment Score
Interview Result
```

---

# 54. Kanban Pipeline

A very important UI.

```text
APPLIED
│
├── Candidate A
├── Candidate B
└── Candidate C

SCREENING
│
├── Candidate D
└── Candidate E

SHORTLISTED
│
├── Candidate F
└── Candidate G

ASSESSMENT
│
└── Candidate H

TECHNICAL
│
└── Candidate I

HR
│
└── Candidate J

HIRED
│
└── Candidate K
```

Recruiter can move candidates between stages according to permissions and workflow rules.

---

# 55. Notification System

The platform should support:

```text
In-app notifications
Email notifications
Interview reminders
Assessment reminders
Application alerts
```

Example:

```text
🔔 New Application

Manoj applied for:
Software Engineer

AI Match:
91%

[View Candidate]
```

---

# 56. Search & Filtering

Recruiters should search by:

```text
Candidate Name
Email
Skill
Job
Stage
Match Score
Experience
Education
Assessment Score
Interview Result
Application Date
```

Example:

```text
Python + PostgreSQL
Match > 80
Stage = Shortlisted
```

---

# 57. Analytics

Analytics dashboard:

```text
Applications
      ↓
Screening
      ↓
Shortlisted
      ↓
Assessment
      ↓
Technical
      ↓
HR
      ↓
Hired
```

Metrics:

* Conversion rate
* Candidates per stage
* Average time per stage
* Average match score
* Assessment pass rate
* Interview pass rate
* Hiring rate
* Time-to-hire
* Applications per job

---

# 58. Security Requirements

The original specification requires password hashing, JWT protection, upload validation, private resume handling, sanitized inputs and environment-based secrets. 

Implement:

### Authentication

```text
JWT
Password Hashing
Access Token
Refresh Token
```

### File Security

Only allow:

```text
PDF
```

Optionally:

```text
DOCX
```

Validate:

```text
File type
File size
Extension
MIME type
```

---

# 59. Resume Privacy

Resumes should **not** be publicly accessible.

Bad:

```text
https://server.com/resumes/manoj.pdf
```

Better:

```text
Authenticated request
       ↓
Backend authorization
       ↓
Temporary signed URL
       ↓
Resume
```

For production:

**AWS S3 private bucket + signed URLs.**

---

# 60. AI Safety / Hiring Decision Policy

This is important.

The AI should be presented as:

> **Recruiter-assistance and candidate-matching software.**

Not:

> "AI decides who gets hired."

The recruiter retains control over:

* Shortlisting
* Rejection
* Interview evaluation
* Final selection

The original project specification explicitly states that candidate data should not be used by the system to make real-world employment decisions. 

---

# 61. Non-Functional Requirements

## Performance

Target:

```text
API response:
< 500 ms
```

for normal CRUD operations.

Resume parsing/AI processing can be asynchronous.

---

# 62. Background Processing

Do **not** make the candidate wait while:

```text
PDF parsing
+
NLP
+
AI matching
```

runs.

Instead:

```text
Candidate submits
       ↓
Application saved
       ↓
HTTP 202 / success
       ↓
Background processing
       ↓
Resume parsing
       ↓
AI matching
       ↓
Ranking updated
```

For a simple MVP, this can initially run as a background task. Later introduce:

```text
Redis
+
Celery / RQ
```

or another job queue.

---

# 63. Recommended Tech Stack

| Layer           | Technology          |
| --------------- | ------------------- |
| Frontend        | React               |
| Language        | TypeScript          |
| Styling         | Tailwind CSS        |
| Backend         | FastAPI             |
| Language        | Python              |
| ORM             | SQLAlchemy          |
| Validation      | Pydantic            |
| Database        | PostgreSQL          |
| Authentication  | JWT                 |
| Resume Parsing  | pypdf/pdfplumber    |
| NLP             | spaCy               |
| AI Matching     | Python + embeddings |
| File Storage    | Local → S3          |
| Email           | SendGrid/SMTP       |
| Calendar        | Google Calendar API |
| Cache/Queue     | Redis               |
| API Testing     | Postman             |
| Documentation   | Swagger/OpenAPI     |
| Containers      | Docker              |
| Version Control | Git/GitHub          |

This extends the original recommended stack rather than replacing it. 

---

# 64. Deployment Architecture

```text
                 INTERNET
                    │
                    ▼
              Cloud / CDN
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   React Frontend          FastAPI Backend
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
           PostgreSQL        Redis          S3
                                             │
                                          Resumes
```

Possible deployment:

```text
Frontend → Vercel
Backend → Render/Railway
Database → PostgreSQL
Storage → AWS S3
```

Later:

```text
AWS ECS
RDS
S3
CloudFront
Redis
GitHub Actions
```

---

# 65. Docker Architecture

```text
docker-compose.yml

services:

  frontend
      ↓
  backend
      ↓
  postgres
      ↓
  redis
```

Development:

```text
docker compose up
```

---

# 66. Testing Strategy

The original PRD requires unit tests, API tests, validation tests and at least one complete end-to-end flow. 

### Unit Tests

Test:

```text
Match calculation
Skill normalization
Ranking
Deadline validation
Assessment scoring
Pipeline transitions
```

### API Tests

Test:

```text
Login
Create job
Create candidate
Upload resume
Create application
Calculate match
Move stage
Assessment
Interview
```

### E2E Test

The most important test:

```text
Register
 ↓
Login
 ↓
Create Job
 ↓
Generate Link
 ↓
Candidate Applies
 ↓
Upload Resume
 ↓
Parse Resume
 ↓
Calculate Match
 ↓
Shortlist
 ↓
Send Assessment
 ↓
Submit Assessment
 ↓
Pass
 ↓
Schedule Technical
 ↓
Pass
 ↓
HR
 ↓
Hire
```

---

# 67. Important Edge Cases

The system must handle:

### Expired Job

```text
Candidate opens link
       ↓
Expired
       ↓
Application rejected
```

### Duplicate Application

```text
Same candidate
+
Same job
```

System should warn or prevent duplicates according to configured rules.

### Invalid Resume

```text
Wrong file
Too large
Corrupted PDF
```

Show appropriate error.

### AI Processing Failure

Application should **not disappear**.

```text
Processing Failed
       ↓
Retry
       ↓
If repeated failure:
Manual Review
```

### Assessment Expired

```text
Assessment Deadline Passed
       ↓
Attempt Closed
       ↓
Status = EXPIRED
```

### Interview Cancellation

```text
Scheduled
 ↓
Cancelled
 ↓
Reschedule
```

---

# 68. Workflow State Machine

Each application should have controlled states.

```text
APPLIED
   │
   ▼
SCREENING
   │
   ├──────────────→ REJECTED
   │
   ▼
SHORTLISTED
   │
   ▼
ASSESSMENT
   │
   ├──────────────→ REJECTED
   │
   ▼
TECHNICAL_INTERVIEW
   │
   ├──────────────→ REJECTED
   │
   ▼
HR_INTERVIEW
   │
   ├──────────────→ REJECTED
   │
   ▼
SELECTED
   │
   ▼
OFFER_SENT
   │
   ▼
HIRED
   │
   ▼
ONBOARDING
```

---

# 69. Role-Based Access Control

Later:

```text
ADMIN
 │
 ├── Manage users
 ├── Manage jobs
 └── View everything

RECRUITER
 │
 ├── Manage assigned jobs
 ├── Candidates
 ├── Assessments
 └── Interviews

INTERVIEWER
 │
 └── View assigned interviews
     + submit feedback
```

---

# 70. Auditability

Every important action should be logged.

Example:

```text
Recruiter:
John

Action:
Shortlisted Candidate

Candidate:
ABC

Job:
Software Engineer

Time:
2026-09-11 10:25
```

This is valuable for debugging and enterprise-style design discussions.

---

# 71. Complete End-to-End Technical Flow

```text
                    ┌──────────────┐
                    │   RECRUITER  │
                    └──────┬───────┘
                           ↓
                    Create Job
                           ↓
                  Generate Form
                           ↓
                 Generate Token
                           ↓
                 Set Expiry Date
                           ↓
                    Publish Job
                           ↓
                    Share Link
                           ↓
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
         Candidate A               Candidate B
              │                         │
              └────────────┬────────────┘
                           ↓
                    Submit Application
                           ↓
                    Store Candidate
                           ↓
                    Store Resume
                           ↓
                    Parse Resume
                           ↓
                  Extract Candidate Data
                           ↓
                    AI Matching Engine
                           ↓
                    Calculate Score
                           ↓
                    Generate Explanation
                           ↓
                    Rank Candidates
                           ↓
                    Recruiter Dashboard
                           ↓
                       SCREENING
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
             REJECT                SHORTLIST
                │                     │
                ▼                     ▼
          Rejection Mail         Assessment Mail
                                      │
                                      ▼
                              Assessment Platform
                                      │
                                      ▼
                               Track Completion
                                      │
                                      ▼
                                  Evaluate
                                      │
                            ┌─────────┴─────────┐
                            ▼                   ▼
                          FAIL                 PASS
                            │                   │
                            ▼                   ▼
                         Reject            Technical
                                          Interview
                                              │
                                              ▼
                                          Schedule
                                              │
                                              ▼
                                          Evaluate
                                              │
                                     ┌────────┴────────┐
                                     ▼                 ▼
                                   FAIL               PASS
                                     │                 │
                                     ▼                 ▼
                                  Reject             HR
                                                     │
                                                     ▼
                                                  Schedule
                                                     │
                                                     ▼
                                                  Evaluate
                                                     │
                                           ┌─────────┴─────────┐
                                           ▼                   ▼
                                         FAIL                 PASS
                                           │                   │
                                           ▼                   ▼
                                        Reject               Hired
                                                               │
                                                               ▼
                                                         Offer Email
                                                               │
                                                               ▼
                                                      Candidate Accepts
                                                               │
                                                               ▼
                                                        Welcome Email
                                                               │
                                                               ▼
                                                          Onboarding
                                                               │
                                                               ▼
                                                            END
```

---

# 72. MVP vs Advanced Version

Do **not** attempt everything on day one.

## Phase 1 — Core ATS

```text
Authentication
Jobs
Candidates
Applications
Pipeline
Dashboard
```

## Phase 2 — AI

```text
Resume Upload
PDF Parsing
Skill Extraction
AI Matching
Candidate Ranking
Explainable Results
```

## Phase 3 — Recruitment Automation

```text
Public Application Link
Expiry
Email Templates
Automated Emails
Assessment
Assessment Tracking
```

## Phase 4 — Interview Management

```text
Calendar
Technical Interview
HR Interview
Interview Feedback
Scheduling
```

## Phase 5 — Production

```text
AWS S3
Redis
Background Jobs
Docker
CI/CD
Monitoring
Analytics
RBAC
Audit Logs
```

This follows the original project's principle: **finish the end-to-end working MVP before adding infrastructure such as Redis, Kafka, Kubernetes or advanced cloud architecture.** 

---

# 73. Suggested GitHub Structure

```text
ai-recruitment-ats/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── core/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── tests/
│   └── requirements.txt
│
├── ai/
│   ├── resume_parser/
│   ├── skill_extractor/
│   ├── matcher/
│   └── ranking/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── workflows.md
│
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

The original repository proposal similarly separates frontend, backend API/models/schemas/services, tests, docs, Docker and environment configuration. 

---

# 74. Definition of Done

The complete project is considered successful when:

### Job

* [ ] Recruiter can register/login.
* [ ] Recruiter can create a job.
* [ ] Recruiter can edit a job.
* [ ] Recruiter can close a job.
* [ ] Recruiter can set deadline.
* [ ] System generates public application link.
* [ ] Link expires automatically.

### Candidate

* [ ] Candidate can open public link.
* [ ] Candidate can fill form.
* [ ] Candidate can upload resume.
* [ ] Application is stored.
* [ ] Duplicate applications are handled.

### AI

* [ ] Resume text extracted.
* [ ] Skills extracted.
* [ ] Education extracted.
* [ ] Experience extracted.
* [ ] Match score calculated.
* [ ] Matched skills shown.
* [ ] Missing skills shown.
* [ ] Explanation generated.
* [ ] Candidates ranked.

### Pipeline

* [ ] Applied.
* [ ] Screening.
* [ ] Shortlisted.
* [ ] Assessment.
* [ ] Technical interview.
* [ ] HR interview.
* [ ] Final selection.
* [ ] Offer.
* [ ] Onboarding.
* [ ] Rejection branches.

### Automation

* [ ] Application confirmation.
* [ ] Shortlist email.
* [ ] Rejection email.
* [ ] Assessment email.
* [ ] Assessment result.
* [ ] Interview invitation.
* [ ] Interview result.
* [ ] Offer email.
* [ ] Welcome email.

### Dashboard

* [ ] Overall dashboard.
* [ ] Job dashboard.
* [ ] Candidate dashboard.
* [ ] Pipeline.
* [ ] Ranking.
* [ ] Analytics.
* [ ] Interview calendar.

### Engineering

* [ ] REST API.
* [ ] Swagger documentation.
* [ ] PostgreSQL.
* [ ] JWT authentication.
* [ ] Password hashing.
* [ ] File validation.
* [ ] Private resume storage.
* [ ] Tests.
* [ ] Docker.
* [ ] README.
* [ ] No secrets committed to GitHub.

---

# 75. Final Product Concept 🚀

The final application should feel like this:

```text
                    AI RECRUITMENT ATS
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    JOB ENGINE        AI ENGINE         WORKFLOW ENGINE
        │                  │                  │
        │                  │                  │
   Create Jobs        Parse Resume       Screening
   Public Links       Extract Skills     Assessment
   Expiry             Match Score        Technical
   Application        Ranking            HR
   Forms              Explanation        Hiring
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                    RECRUITER DASHBOARD
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         Candidates     Pipeline      Analytics
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                   AUTOMATED ACTIONS
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           EMAIL        ASSESSMENT     CALENDAR
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                       FINAL HIRING
                           │
                           ▼
                       ONBOARDING
```

**This is the version I would build for your portfolio.** It is substantially stronger than the initial ATS because it demonstrates **full-stack development + REST APIs + relational database design + file processing + NLP/AI + ranking + workflow/state management + background automation + email integration + assessment processing + calendar integration + dashboards**.

Most importantly, it has a coherent story: **"A recruiter creates a job once, shares one application link, and the system manages the candidate lifecycle from application through onboarding."** That is a much stronger interview project than simply saying "I made an ATS with CRUD."
