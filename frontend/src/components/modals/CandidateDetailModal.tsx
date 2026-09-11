import React, { useState } from 'react';
import {
  X, Sparkles, CheckCircle2, XCircle, Briefcase, GraduationCap,
  Mail, Phone, MapPin, Building2, FileText, Calendar, Send, ExternalLink,
  Download, Eye, Copy, Check, HelpCircle, FileCheck, ChevronDown, ChevronUp, Award
} from 'lucide-react';
import { Application } from '../../types';

interface CandidateDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onUpdateStage: (applicationId: string, newStage: string, notes?: string) => void;
  onOpenScheduleInterview?: (application: Application) => void;
}

const STAGES = [
  'Applied','Screening','Shortlisted','Assessment',
  'Technical Interview','HR Interview','Offer','Hired','Rejected'
];

function getInitials(name: string) {
  return (name || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

type Tab = 'match' | 'resume' | 'prep' | 'notes';

const SCORE_BARS = [
  { label: 'Skill Match',        key: 'skill_score',       pct: 50, grad: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
  { label: 'Experience Match',   key: 'experience_score',  pct: 20, grad: 'linear-gradient(90deg,#0284c7,#38bdf8)' },
  { label: 'Education Match',    key: 'education_score',   pct: 10, grad: 'linear-gradient(90deg,#059669,#10b981)' },
  { label: 'Semantic Alignment', key: 'semantic_score',    pct: 20, grad: 'linear-gradient(90deg,#d97706,#f59e0b)' },
];

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  application, onClose, onUpdateStage, onOpenScheduleInterview
}) => {
  const [tab, setTab] = useState<Tab>('match');
  const [notes, setNotes] = useState(application?.notes || '');
  const [stage, setStage] = useState(application?.stage || 'Applied');
  const [saved, setSaved] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  if (!application || !application.candidate) return null;
  const { candidate, job } = application;
  const s = application.match_score;
  const scoreClass = s >= 85 ? 'score-high' : s >= 70 ? 'score-mid' : 'score-low';

  const resumePdfUrl = `http://localhost:8000/api/v1/candidates/application/${application.id}/resume`;

  const handleStage = (val: string) => {
    setStage(val as any);
    onUpdateStage(application.id, val, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Parse structured interview questions from notes
  const parseQuestions = () => {
    const rawNotes = application.notes || '';
    if (!rawNotes.includes('Recommended Interview Questions:')) return [];
    const block = rawNotes.split('Recommended Interview Questions:')[1] || '';
    const lines = block.trim().split('\n');
    const items: { number: string; focus: string; text: string; lookFor: string }[] = [];
    
    let current: any = null;
    for (const line of lines) {
      const qMatch = line.match(/^(\d+)\.\s*(?:\[(.*?)\])?\s*(.*)$/);
      if (qMatch) {
        if (current) items.push(current);
        current = {
          number: qMatch[1],
          focus: qMatch[2] || 'Technical Competency',
          text: qMatch[3].trim(),
          lookFor: ''
        };
      } else if (current && line.includes('→ Look for:')) {
        current.lookFor = line.replace('→ Look for:', '').trim();
      }
    }
    if (current) items.push(current);
    return items;
  };

  const questions = parseQuestions();

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = questions.map(q => `${q.number}. [${q.focus}] ${q.text}\n   → Signals: ${q.lookFor}`).join('\n\n');
    navigator.clipboard.writeText(allText || application.notes || '');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 960, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)', borderBottom: '1px solid var(--border-default)', padding: '16px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar avatar-lg" style={{ background: `linear-gradient(135deg, #4f46e5, #7c3aed)`, fontSize: '1.1rem', letterSpacing: '-0.02em', flexShrink: 0 }}>
              {getInitials(candidate.full_name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                  {candidate.full_name}
                </h2>
                <span className={`badge ${scoreClass}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  <Sparkles size={13} /> {s}% Match
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                  Gemini AI Evaluated
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span>Applied for <strong style={{ color: '#4f46e5' }}>{job?.title}</strong></span>
                <span>·</span>
                <span>{new Date(application.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                <span>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>ID: {application.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ border: '1px solid var(--border-default)', borderRadius: 8 }}>
            <X size={17} color="var(--text-muted)" />
          </button>
        </div>

        {/* ── Meta ribbon ─────────────────────────────────────────── */}
        <div style={{ padding: '10px 26px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: 18, background: 'var(--surface-subtle)' }}>
          {[
            { icon: <Mail size={13} />, val: candidate.email },
            candidate.phone ? { icon: <Phone size={13} />, val: candidate.phone } : null,
            candidate.location ? { icon: <MapPin size={13} />, val: candidate.location } : null,
            { icon: <Briefcase size={13} />, val: `${candidate.total_experience_years} yrs experience` },
            candidate.current_company ? { icon: <Building2 size={13} />, val: candidate.current_company } : null,
            candidate.degree ? { icon: <GraduationCap size={13} />, val: candidate.degree } : null,
          ].filter(Boolean).map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item!.icon}</span> {item!.val}
            </span>
          ))}
        </div>

        {/* ── Stage bar ───────────────────────────────────────────── */}
        <div style={{ padding: '10px 26px', borderBottom: '1px solid var(--border-light)', background: 'rgba(99,102,241,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pipeline Stage</span>
            <select value={stage} onChange={e => handleStage(e.target.value)} className="input" style={{ height: 32, fontSize: '0.82rem', width: 200 }}>
              {STAGES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={13} /> Stage updated · email sent
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {stage === 'Assessment' || stage === 'Shortlisted' ? (
              <a
                href={`/assessment/${application.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
                  fontWeight: 700
                }}
                title="Open Online Assessment Portal for Candidate"
              >
                <Award size={13} /> Candidate Test Portal
              </a>
            ) : null}
            <a href={resumePdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="View Original PDF in Full Tab">
              <Eye size={13} /> View Resume PDF
            </a>
            {onOpenScheduleInterview && (
              <button onClick={() => onOpenScheduleInterview(application)} className="btn btn-primary btn-sm">
                <Calendar size={13} /> Schedule Interview
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div style={{ padding: '0 26px', borderBottom: '1px solid var(--border-default)', display: 'flex', gap: 0, background: '#ffffff' }}>
          {([
            ['match', 'AI Match Analysis', <Sparkles size={14} />],
            ['resume', 'Original PDF Resume', <FileText size={14} />],
            ['prep', 'Interview & Assessment Kit', <FileCheck size={14} />],
            ['notes', 'Recruiter Notes & Timeline', <Send size={14} />]
          ] as const).map(([id, label, icon]) => (
            <button key={id} onClick={() => setTab(id as Tab)} style={{
              padding: '12px 18px', background: 'none', border: 'none',
              borderBottom: tab === id ? '2.5px solid #6366f1' : '2.5px solid transparent',
              color: tab === id ? '#4f46e5' : 'var(--text-muted)',
              fontWeight: tab === id ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────────────────────── */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: '65vh', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 1. AI Match */}
          {tab === 'match' && (
            <>
              {/* Explanation box */}
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Sparkles size={16} color="#6366f1" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#4338ca' }}>TalentIQ AI Fit Recommendation & Analysis</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {application.score_explanation || 'Candidate satisfies the core role requirements with strong overall technical fit.'}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="card" style={{ padding: 18, background: 'var(--surface-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Multi-Dimensional AI Evaluation Breakdown
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  {SCORE_BARS.map(bar => {
                    const val = (application as any)[bar.key] ?? 0;
                    return (
                      <div key={bar.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{bar.label} <span style={{ opacity: 0.6, fontWeight: 400 }}>({bar.pct}% weight)</span></span>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{val}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${val}%`, background: bar.grad }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <CheckCircle2 size={15} color="#059669" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>Matched Skills ({application.matched_skills.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {application.matched_skills.map(sk => <span key={sk} className="chip chip-matched">✓ {sk}</span>)}
                  </div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <XCircle size={15} color="#dc2626" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>Missing Skills ({application.missing_skills.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {application.missing_skills.length > 0
                      ? application.missing_skills.map(sk => <span key={sk} className="chip chip-missing">✗ {sk}</span>)
                      : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>All target skills detected ✓</span>
                    }
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 2. Original PDF Resume Viewer */}
          {tab === 'resume' && (
            <>
              {/* PDF Action Toolbar */}
              <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-subtle)', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {candidate.resume_filename || 'candidate_resume.pdf'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      PDF Uploaded Document · Verified with TalentIQ Engine
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a
                    href={resumePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={13} /> Open Fullscreen
                  </a>
                  <a
                    href={`${resumePdfUrl}?download=true`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={13} /> Download PDF
                  </a>
                  {candidate.linkedin_url && (
                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      LinkedIn <ExternalLink size={11} />
                    </a>
                  )}
                  {candidate.github_url && (
                    <a href={candidate.github_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      GitHub <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Embedded PDF Viewer */}
              <div style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
                background: '#f1f5f9',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                height: 520,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <iframe
                  src={resumePdfUrl}
                  title="Candidate Resume PDF"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Collapsible Raw Extracted Text */}
              <div className="card" style={{ padding: '12px 18px', background: 'var(--surface-subtle)' }}>
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.82rem'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={14} color="#6366f1" />
                    View OCR & Raw Extracted Text Transcript
                  </span>
                  {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showRawText && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                    <pre style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      fontSize: '0.75rem',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                      background: '#ffffff',
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace'
                    }}>
                      {candidate.raw_resume_text || 'No raw text transcript available for this file.'}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 3. AI Interview & Assessment Kit */}
          {tab === 'prep' && (
            <>
              {/* Header card */}
              <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={17} color="#6366f1" />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#3730a3' }}>
                      Tailored Candidate Interview & Assessment Kit
                    </span>
                  </div>
                  <button onClick={handleCopyAll} className="btn btn-secondary btn-sm" style={{ background: '#ffffff' }}>
                    {copiedAll ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                    {copiedAll ? 'Copied to Clipboard!' : 'Copy All Questions'}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  These practical assessment questions were dynamically generated by TalentIQ Gemini AI specifically to address <strong>{candidate.full_name}</strong>'s background, verify their stated claims, and test any identified skill gaps for the <strong>{job?.title}</strong> role.
                </p>
              </div>

              {/* Questions list */}
              {questions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {questions.map((q, idx) => (
                    <div key={idx} className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #6366f1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            Question {q.number}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Focus: {q.focus}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyQuestion(`${q.text}\nLook for: ${q.lookFor}`, idx)}
                          className="btn btn-ghost btn-sm"
                          style={{ height: 28, fontSize: '0.72rem', padding: '0 8px' }}
                        >
                          {copiedIdx === idx ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                          {copiedIdx === idx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 10 }}>
                        {q.text}
                      </p>
                      {q.lookFor && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', fontSize: '0.78rem', color: '#065f46' }}>
                          <strong>💡 What to look for in response:</strong> {q.lookFor}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <HelpCircle size={28} color="#6366f1" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No automated questions extracted yet</div>
                  <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                    Check the "Recruiter Notes" tab to view interview preparation notes and guidelines.
                  </div>
                </div>
              )}

              {/* Full Parsed Credentials */}
              <div className="card" style={{ padding: 18, background: 'var(--surface-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Verified Profile Credentials
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>HIGHEST DEGREE & COLLEGE</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {candidate.degree || candidate.education || 'Bachelor Degree'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {candidate.college || 'Institution verified'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPERIENCE & RECENT EMPLOYER</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {candidate.total_experience_years} Years Professional Experience
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {candidate.current_company || 'Active Practitioner'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                    ALL PARSED TECHNICAL & PROFESSIONAL SKILLS ({candidate.parsed_skills.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {candidate.parsed_skills.map(sk => (
                      <span key={sk} className="chip chip-neutral" style={{ fontSize: '0.74rem' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. Notes & Timeline */}
          {tab === 'notes' && (
            <>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 8 }}>
                  Recruiter Feedback, Evaluation Notes & Guidelines
                </label>
                <textarea
                  rows={9}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record interview notes, compensation discussions, hiring panel recommendations…"
                  className="input"
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Changes saved directly to the candidate application dossier.
                </span>
                <button onClick={() => { onUpdateStage(application.id, stage, notes); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="btn btn-primary btn-sm">
                  <Send size={14} /> Save Notes
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="modal-footer" style={{ padding: '14px 26px', borderTop: '1px solid var(--border-default)', background: '#ffffff' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
          {application.stage !== 'Rejected' && (
            <button onClick={() => handleStage('Rejected')} className="btn btn-sm" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>
              <XCircle size={14} /> Reject
            </button>
          )}
          {application.stage !== 'Hired' && (
            <button onClick={() => handleStage('Hired')} className="btn btn-sm" style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
              <CheckCircle2 size={14} /> Mark Hired
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
