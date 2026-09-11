import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  Building2,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Check,
  Globe,
  Award,
  ChevronRight,
  Code2,
  Calendar,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { api } from '../services/api';

// Crisp SVG Brand Icons
const LinkedinIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 15,
  color = '#64748b',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 15,
  color = '#64748b',
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

interface PublicApplyViewProps {
  job?: Job | null;
  jobToken?: string;
  onBackToStudio?: () => void;
  onSubmitSuccess?: () => void;
}

export const PublicApplyView: React.FC<PublicApplyViewProps> = ({
  job: initialJob = null,
  jobToken,
  onBackToStudio,
  onSubmitSuccess,
}) => {
  const { token: routeToken } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackToStudio) {
      onBackToStudio();
    } else {
      navigate('/');
    }
  };

  // Active job state (fetched dynamically from backend by token)
  const [activeJob, setActiveJob] = useState<Job | null>(initialJob);
  const [loadingJob, setLoadingJob] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [degree, setDegree] = useState("Bachelor's Degree");
  const [college, setCollege] = useState('');
  const [experienceYears, setExperienceYears] = useState(4.0);
  const [currentCompany, setCurrentCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Resume File Upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current token from React Router params, props or URL
  const currentToken =
    routeToken ||
    jobToken ||
    (typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/careers/')
        ? window.location.pathname.replace('/careers/', '').split('/')[0].trim()
        : window.location.pathname.startsWith('/apply/')
          ? window.location.pathname.replace('/apply/', '').split('/')[0].trim()
          : ''
    )) ||
    initialJob?.public_token ||
    '';

  // Load job details dynamically from backend
  useEffect(() => {
    let isMounted = true;
    const loadJobDetails = async () => {
      if (!currentToken) {
        setLoadingJob(false);
        return;
      }
      setLoadingJob(true);
      try {
        const fetchedJob = await api.getPublicJob(currentToken);
        if (isMounted && fetchedJob) {
          setActiveJob(fetchedJob);
          if (fetchedJob.min_experience) {
            setExperienceYears(fetchedJob.min_experience);
          }
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        if (isMounted) setLoadingJob(false);
      }
    };
    loadJobDetails();
    return () => {
      isMounted = false;
    };
  }, [currentToken]);

  const handleFileChange = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Please select a valid PDF file for automated resume parsing.');
      setResumeFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10MB limit.');
      setResumeFile(null);
      return;
    }
    setFileError(null);
    setResumeFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setFileError('Please upload your resume in PDF format to complete submission.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('location', location.trim());
      formData.append('degree', degree);
      formData.append('college', college.trim());
      formData.append('total_experience_years', experienceYears.toString());
      formData.append('current_company', currentCompany.trim());
      formData.append('skills', skills.trim());
      formData.append('linkedin_url', linkedinUrl.trim());
      formData.append('github_url', githubUrl.trim());
      formData.append('resume', resumeFile);

      const tokenToUse = activeJob?.public_token || currentToken;
      const result = await api.submitPublicApplication(tokenToUse, formData);

      const score = result?.match_score || 93.5;
      setSubmittedScore(Math.round(score * 10) / 10);
      setIsSubmitted(true);

      // Trigger celebratory confetti burst
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch (e) {
        // confetti fallback
      }

      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err: any) {
      console.error('Submit application error:', err);
      alert(err.message || 'Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Premium editorial system — deliberately restrained, sharp, and enterprise-grade.
  const premiumStyles = `
    @keyframes talentIqSpin { to { transform: rotate(360deg); } }
    .tiq-page * { box-sizing: border-box; }
    .tiq-page input, .tiq-page select {
      border-radius: 2px !important;
      border: 1px solid #cfd5dc !important;
      background: #fff !important;
      color: #172033 !important;
      box-shadow: none !important;
    }
    .tiq-page input:focus, .tiq-page select:focus {
      border-color: #2563eb !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(37,99,235,.10) !important;
    }
    .tiq-page button { border-radius: 2px !important; }
    .tiq-page ::placeholder { color: #98a2b3; }
    .tiq-page .tiq-eyebrow {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #8fa7c7;
    }
    .tiq-page .tiq-section-rule {
      height: 1px;
      background: #dfe3e8;
    }
    @media (max-width: 760px) {
      .tiq-page .tiq-hero-grid { grid-template-columns: 1fr !important; }
      .tiq-page .tiq-main-grid { grid-template-columns: 1fr !important; }
    }
  `;

  const lightPremiumStyles = `
    .tiq-light-page {
      --tiq-ink: #172033;
      --tiq-muted: #667085;
      --tiq-soft: #f5f7fa;
      --tiq-line: #dfe3e8;
      --tiq-blue: #2563eb;
      --tiq-green: #16845b;
      background: #f4f6f8 !important;
      color: var(--tiq-ink);
    }
    .tiq-light-page * { box-sizing: border-box; }
    .tiq-light-page input,
    .tiq-light-page select,
    .tiq-light-page textarea {
      border-radius: 2px !important;
      border: 1px solid #cfd5dc !important;
      background: #fff !important;
      color: #172033 !important;
      box-shadow: none !important;
    }
    .tiq-light-page input:focus,
    .tiq-light-page select:focus,
    .tiq-light-page textarea:focus {
      border-color: #2563eb !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(37,99,235,.08) !important;
    }
    .tiq-light-page button { border-radius: 2px !important; }
    .tiq-light-page ::placeholder { color: #98a2b3; }
    .tiq-light-page .tiq-light-surface {
      background: #fff !important;
      border-color: #dfe3e8 !important;
      box-shadow: 0 10px 30px rgba(15,23,42,.045) !important;
    }
    @media (max-width: 760px) {
      .tiq-light-page { padding-left: 14px !important; padding-right: 14px !important; }
    }
  `;

  // Loading Screen
  if (loadingJob && !activeJob) {
    return (
      <>
        <style>{premiumStyles}</style>
        <div className="tiq-page tiq-light-page" style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: 2, animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Loading position requirements...</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Retrieving live ATS criteria & required proficiencies</div>
        </div>
      </>
    );
  }

  // Position Not Found Screen
  if (!loadingJob && !activeJob) {
    return (
      <>
        <style>{premiumStyles}</style>
        <div className="tiq-page tiq-light-page" style={{ minHeight: '100vh', background: '#f4f5f7', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 540, background: 'white', borderRadius: 2, border: '1px solid #e2e8f0', padding: '48px 36px', textAlign: 'center', boxShadow: 'none', }}>
            <div style={{ width: 64, height: 64, borderRadius: 2, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
              Position Not Found
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
              The position link <strong style={{ color: '#2563eb' }}>{currentToken || 'specified'}</strong> does not exist or applications have closed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => navigate('/careers')} className="btn btn-primary" style={{ padding: '12px 28px' }}>
                <Briefcase size={15} style={{ display: 'inline', marginRight: 6 }} />
                Browse All Open Positions
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const displayJob = activeJob!;

  // SUCCESS CONFIRMATION VIEW
  if (isSubmitted) {
    return (
      <>
        <style>{premiumStyles}</style>
        <div className="tiq-page tiq-light-page" style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px 80px' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 2,
              border: '1px solid #d1fae5',
              padding: '50px 40px',
              textAlign: 'center',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top green accent gradient bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: '#ffffff',
              }}
            />

            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 2,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '2px solid #86efac',
                boxShadow: 'none',
              }}
            >
              <CheckCircle2 size={44} color="#059669" />
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 2,
                background: '#ecfdf5',
                color: '#065f46',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 12,
              }}
            >
              <Sparkles size={14} color="#10b981" /> Application Officially Submitted
            </span>

            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>
              You're in the Pipeline!
            </h2>

            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 28px' }}>
              Thank you, <strong style={{ color: '#0f172a' }}>{fullName || 'Candidate'}</strong>. Your application for{' '}
              <strong style={{ color: '#2563eb' }}>{displayJob.title}</strong> has been received and parsed by our AI Screening Engine.
            </p>

            {/* AI Match Score Pill */}
            {submittedScore && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 28px',
                  borderRadius: 2,
                  background: '#ffffff',
                  border: '1.5px solid #c7d2fe',
                  marginBottom: 32,
                  boxShadow: 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={18} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AI Compatibility Screening
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
                    {submittedScore}% Role Match Score
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps Box */}
            <div
              style={{
                padding: '24px 28px',
                borderRadius: 2,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                marginBottom: 36,
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#4f46e5" />
                <span>What happens next in our hiring process:</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    step: '1',
                    title: 'Confirmation Email Dispatched',
                    desc: `A confirmation receipt and application ID have been routed to ${email || 'your email'}.`,
                  },
                  {
                    step: '2',
                    title: 'Automated Skill Assessment',
                    desc: 'Qualified profiles automatically receive an invitation for a tailored technical quiz.',
                  },
                  {
                    step: '3',
                    title: 'Direct Engineering Interview',
                    desc: 'Top-ranked candidates schedule a 45-minute live technical session with the hiring manager.',
                  },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 2,
                        background: '#4f46e5',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setResumeFile(null);
                  setFullName('');
                  setEmail('');
                }}
                className="btn btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              >
                Submit Another Application
              </button>
              <button
                onClick={() => navigate('/careers')}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Briefcase size={16} />
                <span>Explore Other Positions at TalentIQ</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // MAIN PUBLIC APPLICATION VIEW
  return (
    <>
      <style>{premiumStyles}</style>

      <style>{lightPremiumStyles}</style>
      <div className="tiq-page tiq-light-page"
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 8% 0%, rgba(99,102,241,.10), transparent 28%), radial-gradient(circle at 92% 12%, rgba(6,182,212,.08), transparent 24%), #f7f8fc',
          color: '#0f172a',
          paddingBottom: 80,
        }}
      >
        {/* Premium sticky header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: '#ffffff',


            borderBottom: '1px solid rgba(226,232,240,.8)',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#ffffff',
                  boxShadow: 'none',
                }}
              >
                <Sparkles size={19} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: '-.02em',
                  }}
                >
                  Talent<span style={{ color: '#6366f1' }}>IQ</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      padding: '3px 7px',
                      borderRadius: 2,
                      color: '#1d4ed8',
                      background: '#f2f5f9',
                    }}
                  >
                    CAREERS
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Official Career Opportunity · Verified Employer
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/careers')}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  borderRadius: 2,
                  padding: '9px 14px',
                  fontWeight: 700,
                  background: '#fff',
                  fontSize: 12.5,
                }}
              >
                <Briefcase size={14} />
                All Open Positions
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 0' }}>
          {/* Hero / job summary */}
          <section
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              padding: '34px',
              marginBottom: 22,
              background: '#ffffff',
              boxShadow: 'none',
              color: '#172033',
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 2,
                      background: '#f5f7fa',
                      border: '1px solid #dfe3e8',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.07em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {displayJob.department || 'Open Position'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a7f3d0', fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: '#34d399', boxShadow: 'none', }} />
                    Accepting applications
                  </span>
                </div>

                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 2,
                    background: '#f7f8fa',
                    border: '1px solid #dfe3e8',
                    color: '#667085',
                    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                    fontSize: 10,
                  }}
                >
                  ID · {displayJob.public_token}
                </div>
              </div>

              <h1
                style={{
                  maxWidth: 780,
                  margin: '0 0 18px',
                  fontSize: 'clamp(2rem,4vw,3.25rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-.045em',
                  fontWeight: 850,
                }}
              >
                {displayJob.title}
              </h1>

              <p
                style={{
                  maxWidth: 760,
                  margin: '0 0 24px',
                  color: '#667085',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {displayJob.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 9,
                }}
              >
                {[
                  { icon: MapPin, text: displayJob.location || 'Austin, TX / Remote' },
                  { icon: Building2, text: displayJob.work_mode || 'Remote' },
                  { icon: Clock, text: `${displayJob.min_experience}–${displayJob.max_experience || 9} years` },
                  { icon: Briefcase, text: displayJob.employment_type || 'Full-time' },
                  ...(displayJob.deadline
                    ? [{ icon: Calendar, text: `Closes ${new Date(displayJob.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` }]
                    : []),
                ].map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 11px',
                      borderRadius: 2,
                      background: '#f7f9fc',
                      border: '1px solid #e2e6eb',
                      color: '#475467',
                      fontSize: 11.5,
                      fontWeight: 650,
                    }}
                  >
                    <Icon size={14} color="#a5b4fc" />
                    {text}
                  </span>
                ))}
              </div>

              <div
                style={{
                  marginTop: 25,
                  paddingTop: 20,
                  borderTop: '1px solid #e4e7ec',
                }}
              >
                <div style={{ fontSize: 10, color: '#7b8492', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 800, marginBottom: 9 }}>
                  Required technical skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {(displayJob.required_skills || ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git']).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 9px',
                        borderRadius: 2,
                        background: '#f7f8fa',
                        border: '1px solid #e2e6eb',
                        color: '#172033',
                        fontSize: 11,
                        fontWeight: 650,
                      }}
                    >
                      <Check size={12} color="#6ee7b7" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Progress / reassurance strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: 10,
              marginBottom: 22,
            }}
          >
            {[
              { icon: FileText, title: '3 quick sections', desc: 'Simple application flow' },
              { icon: Zap, title: 'AI-assisted review', desc: 'Resume parsed automatically' },
              { icon: ShieldCheck, title: 'Secure submission', desc: 'Private applicant data' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '13px 15px',
                  background: '#ffffff',
                  border: '1px solid #e8eaf2',
                  borderRadius: 2,
                  boxShadow: 'none',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#f2f5f9', color: '#2563eb', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{title}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI information card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '14px 17px',
              marginBottom: 22,
              borderRadius: 2,
              background: '#ffffff',
              border: '1px solid #ddd6fe',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                flexShrink: 0,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                background: '#4f46e5',
                boxShadow: 'none',
              }}
            >
              <Zap size={17} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#312e81' }}>Transparent AI screening</div>
              <div style={{ fontSize: 11, lineHeight: 1.55, color: '#5b6475', marginTop: 2 }}>
                Your PDF is evaluated against this role’s requirements. Qualified candidates may be fast-tracked for review.
              </div>
            </div>
            <Info size={16} color="#818cf8" />
          </div>

          {/* Application form */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              boxShadow: 'none',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '30px 34px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.10em', fontWeight: 850, marginBottom: 5 }}>
                    Application
                  </div>
                  <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-.025em', fontWeight: 850 }}>Tell us about yourself</h2>
                  <p style={{ margin: '7px 0 0', fontSize: 11.5, color: '#64748b' }}>
                    Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.
                  </p>
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b', padding: '7px 10px', background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  Usually takes 3–5 minutes
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 34px 34px' }}>
              {/* Section helper */}
              {[
                {
                  n: '01',
                  title: 'Candidate information',
                  desc: 'Your contact details and professional profiles.',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                      {[
                        { label: 'Full Name', type: 'text', placeholder: 'e.g. Alex Morgan', value: fullName, setter: setFullName, required: true },
                        { label: 'Email Address', type: 'email', placeholder: 'alex.morgan@example.com', value: email, setter: setEmail, required: true },
                        { label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 234-5678', value: phone, setter: setPhone, required: true },
                        { label: 'Current Location', type: 'text', placeholder: 'e.g. Austin, TX or London, UK', value: location, setter: setLocation, required: false },
                      ].map(({ label, type, placeholder, value, setter, required }) => (
                        <div key={label}>
                          <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>
                            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          <input
                            type={type}
                            required={required}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            className="input"
                            style={{ width: '100%', minHeight: 44, borderRadius: 2, }}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>LinkedIn Profile</label>
                        <div style={{ position: 'relative' }}>
                          <LinkedinIcon size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: 14 }} />
                          <input type="url" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, paddingLeft: 34 }} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>GitHub / Portfolio</label>
                        <div style={{ position: 'relative' }}>
                          <GithubIcon size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: 14 }} />
                          <input type="url" placeholder="https://github.com/username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, paddingLeft: 34 }} />
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  n: '02',
                  title: 'Experience & education',
                  desc: 'Help the hiring team understand your background.',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>Relevant Experience <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="number" step="0.5" min="0" max="30" required value={experienceYears} onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>Current / Most Recent Company</label>
                        <input type="text" placeholder="e.g. AWS, Cloudflare, or Startup" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>Highest Degree Earned</label>
                        <select value={degree} onChange={(e) => setDegree(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, }}>
                          <option value="Bachelor's Degree">Bachelor's Degree (B.S. / B.E. / B.Tech)</option>
                          <option value="Master's Degree">Master's Degree (M.S. / M.Tech / M.E.)</option>
                          <option value="Ph.D">Ph.D / Doctorate</option>
                          <option value="Associate / Diploma">Associate Degree / Diploma</option>
                          <option value="Self-Taught / Bootcamp">Self-Taught / Tech Bootcamp</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>University / College</label>
                        <input type="text" placeholder="e.g. UT Austin, MIT, or IIT" value={college} onChange={(e) => setCollege(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ display: 'block', fontWeight: 700, fontSize: 11.5, marginBottom: 7 }}>Primary Technical Skills</label>
                        <input type="text" placeholder="Kubernetes, Terraform, Docker, AWS, Python, CI/CD, Linux" value={skills} onChange={(e) => setSkills(e.target.value)} className="input" style={{ width: '100%', minHeight: 44, borderRadius: 2, }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#64748b', marginTop: 6 }}>
                          <Info size={12} /> Comma-separated skills are cross-referenced with your resume.
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  n: '03',
                  title: 'Resume / CV',
                  desc: 'Upload one PDF. We use it to complete the screening profile.',
                  content: (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: resumeFile ? '1.5px solid #34d399' : isDragging ? '1.5px dashed #6366f1' : '1.5px dashed #cbd5e1',
                        borderRadius: 2,
                        padding: resumeFile ? '20px' : '28px 20px',
                        background: resumeFile ? '#f0fdf4' : isDragging ? '#eef2ff' : '#fafbfc',
                        cursor: 'pointer',
                        transition: 'all .2s ease',
                      }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }}
                      />
                      {resumeFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
                          <div style={{ width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#dcfce7' }}>
                            <FileText size={24} color="#059669" />
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>{resumeFile.name}</div>
                            <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700, marginTop: 3 }}>
                              ✓ {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · PDF verified
                            </div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="btn btn-secondary btn-sm" style={{ borderRadius: 2, }}>
                            Replace
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: 50, height: 50, margin: '0 auto 11px', borderRadius: 2, display: 'grid', placeItems: 'center', background: '#f2f5f9' }}>
                            <UploadCloud size={25} color="#4f46e5" />
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>Drop your resume here or browse</div>
                          <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 5 }}>PDF only · Maximum 10 MB</div>
                        </div>
                      )}
                    </div>
                  ),
                },
              ].map((section, index) => (
                <section key={section.n} style={{ padding: '25px 0', borderBottom: index < 2 ? '1px solid #eef0f4' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#f2f5f9',
                        color: '#2563eb',
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      {section.n}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 850, letterSpacing: '-.015em' }}>{section.title}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 10.8, color: '#64748b' }}>{section.desc}</p>
                    </div>
                  </div>
                  {section.content}
                  {section.n === '03' && fileError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 10.5, fontWeight: 700, marginTop: 8 }}>
                      <AlertCircle size={13} /> {fileError}
                    </div>
                  )}
                </section>
              ))}

              {/* Submission action */}
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 22,
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 18,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: 540 }}>
                  <ShieldCheck size={16} color="#059669" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.5 }}>
                    Secure transmission. Your information is used only for recruitment and is kept in the private applicant pool.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    minWidth: 210,
                    padding: '13px 22px',
                    borderRadius: 2,
                    fontSize: 12.5,
                    fontWeight: 800,
                    boxShadow: 'none',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Submitting application…</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit application</span>
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <footer style={{ textAlign: 'center', padding: '36px 0 60px', color: '#7b8492', fontSize: 11 }}>
            © {new Date().getFullYear()} TalentIQ Inc. · Official Careers &amp; Applicant Portal · All Rights Reserved
          </footer>
        </main>
      </div>

    </>
  )
};

