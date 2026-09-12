# TalentIQ — AI-Powered Recruitment & Autonomous Proctoring Suite

TalentIQ is an end-to-end, enterprise-grade AI Recruitment & Autonomous Proctoring Platform. It streamlines the modern hiring pipeline—from candidate resume parsing and intelligent screening to full-screen, computer-vision proctored technical evaluations and automated interview scheduling.

---

## 🌟 Key Architecture & Capabilities

### 1. 🧠 Intelligent Candidate Screening & ATS Engine (Backend)
- **FastAPI Core**: Ultra-fast RESTful APIs with asynchronous endpoints and SQLAlchemy ORM.
- **AI Resume Parser & Scorer**: Automatically evaluates candidate resumes against job specifications with semantic fit scoring and skill match breakdown.
- **Automated Workflow Stages**: Applied ➔ AI Screening ➔ Shortlisted ➔ Proctored Assessment ➔ Technical Interview ➔ Offer / Rejection.
- **Automated Communication & Scheduling**: Email dispatcher with automated evaluation notifications and Google Meet interview scheduling.

### 2. 👁️ Autonomous Computer Vision Proctoring Engine
- **TensorFlow BlazeFace 3D Head-Pose**: Real-time 3D facial landmark detection tracking pitch, yaw, and roll orientation.
- **Biometric Iris & Pupil Gaze Vector Analysis**: High-precision eye tracker calculates horizontal and vertical pupil excursions to detect off-screen glances, ceiling glances, and looking down at a mobile phone or lap.
- **Adaptive Calibration**: Learns each candidate's natural resting baseline when looking at the screen.
- **Pattern Strike Auto-Submit Engine**:
  - Distinguishes momentary natural reading eye movements from persistent cheating patterns.
  - **3-Strike Pattern Rule**: Repeated suspicious glances away trigger warnings; 3 strikes immediately auto-submits and disqualifies the exam.
  - **Prolonged Focus Loss**: Uninterrupted gaze away for $>3.5$ seconds instantly auto-submits the exam.
  - **Zero-Tolerance Violations**: Face absence, multiple occupants, tab switching, or exiting fullscreen immediately terminates and disqualifies the session.

### 3. 🖥️ Full-Screen Enterprise Assessment Workstation (Frontend)
- **Edge-to-Edge Full-Screen Architecture**: Clean, full-viewport workstation layout without boxed card-in-card containers.
- **Pre-Assessment Command Terminal**: Biometric verification station, live video and retina calibration terminal, and zero-tolerance anti-cheat directives.
- **Active Testing Workstation**:
  - **Docked AI Camera Proctor**: Pinned sidebar stream with live iris tracking crosshairs, directional gaze vectors, and illuminated pattern strikes bar `[• • •]`.
  - **Interactive Question Palette**: Direct navigation with answered and current state indicators.
  - **Full-Width Canvas**: High-clarity typography, option choice rows, and pinned action bar.
- **Forensic Termination Audit Dossier**: Timestamped incident evidence with AI proctoring logs recorded for the recruiter.

---

## 🚀 Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Uvicorn, SQLite / PostgreSQL, Pydantic, Pytest
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Computer Vision & AI**: TensorFlow.js (`@tensorflow/tfjs`), BlazeFace (`@tensorflow-models/blazeface`)

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip
- Git

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Candidate & Recruiter Portal will be available at `http://localhost:5173`.

---

## 🔒 Proctoring Security Policies

| Violation Type | Detection Mechanism | Policy Action |
| :--- | :--- | :--- |
| **Mobile Phone / Lap Focus** | Normalized $\Delta EyeY > 0.32$ / Downward pitch | Strike Warning ➔ Disqualification on 3 strikes / $>3.5$s |
| **Side Glances / Multi-Display** | Normalized $|\Delta EyeX| > 0.32$ / Yaw deviation | Strike Warning ➔ Disqualification on 3 strikes |
| **Candidate Absent** | 0 faces detected in webcam stream ($\ge 1.5$s) | Immediate Auto-Submit & Disqualification |
| **Unauthorized Assistance** | $\ge 2$ faces detected in webcam frame | Immediate Auto-Submit & Disqualification |
| **Fullscreen Escape** | `fullscreenchange` DOM event | Immediate Auto-Submit & Disqualification |
| **Window / Tab Navigation** | `visibilitychange` (`document.hidden`) | Immediate Auto-Submit & Disqualification |
| **Clipboard / DevTools** | Right-click, Copy, Cut, Paste, F12, Dev Shortcuts | Prevented & Logged |

---

## 📄 License
MIT License. Developed for enterprise hiring and automated technical vetting.
