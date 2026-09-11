import React from 'react';
import {
  Plus, Share2, ExternalLink, Clock, MapPin, Users,
  CheckCircle2, XCircle, Globe, Layers, Sparkles
} from 'lucide-react';
import { Job } from '../types';

interface JobsViewProps {
  jobs: Job[];
  onOpenCreateJob: () => void;
  onOpenShareModal: (job?: Job) => void;
  onOpenPublicApply: (token: string) => void;
  onToggleStatus: (jobId: string) => void;
}

const DEPT_COLORS: Record<string, [string, string]> = {
  'AI':            ['rgba(99,102,241,0.08)',  '#4f46e5'],
  'Engineering':   ['rgba(99,102,241,0.08)',  '#4f46e5'],
  'Platform':      ['rgba(139,92,246,0.08)',  '#7c3aed'],
  'Infrastructure':['rgba(8,145,178,0.08)',   '#0891b2'],
  'Frontend':      ['rgba(5,150,105,0.08)',   '#059669'],
  'Backend':       ['rgba(2,132,199,0.08)',   '#0284c7'],
  'Data':          ['rgba(220,38,38,0.08)',   '#dc2626'],
  'Design':        ['rgba(249,115,22,0.08)',  '#ea580c'],
  'Product':       ['rgba(168,85,247,0.08)',  '#a855f7'],
  'Security':      ['rgba(217,119,6,0.08)',   '#d97706'],
};

function getDeptColor(dept: string): [string, string] {
  const key = Object.keys(DEPT_COLORS).find(k => dept.toLowerCase().includes(k.toLowerCase()));
  return key ? DEPT_COLORS[key] : ['rgba(100,116,139,0.08)', '#64748b'];
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs, onOpenCreateJob, onOpenShareModal, onOpenPublicApply, onToggleStatus
}) => {
  const activeCount = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = jobs.reduce((a, j) => a + (j.applicant_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="page-banner brand" style={{ position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, zIndex: 1 }}>
          <div>
            <div className="banner-eyebrow"><Sparkles size={12} /> Autonomous Role Management</div>
            <h2 className="banner-title">{jobs.length} Open Position{jobs.length !== 1 ? 's' : ''} Active</h2>
            <p className="banner-desc">
              Every requisition auto-provisions an encrypted candidate portal with AI-powered resume parsing and multi-vector matching.
            </p>
            <div className="stat-row" style={{ marginTop: 16 }}>
              <div className="stat-item">
                <CheckCircle2 size={14} color="rgba(255,255,255,0.7)" />
                <span className="stat-item-value" style={{ color: 'white' }}>{activeCount}</span>
                <span className="stat-item-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Active</span>
              </div>
              <div className="stat-item">
                <Users size={14} color="rgba(255,255,255,0.7)" />
                <span className="stat-item-value" style={{ color: 'white' }}>{totalApplicants}</span>
                <span className="stat-item-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Applicants</span>
              </div>
              <div className="stat-item">
                <Clock size={14} color="rgba(255,255,255,0.7)" />
                <span className="stat-item-value" style={{ color: 'white' }}>&lt; 2h</span>
                <span className="stat-item-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Avg Response</span>
              </div>
            </div>
          </div>
          <button onClick={onOpenCreateJob} className="btn btn-lg" style={{ background: 'white', color: '#4f46e5', fontWeight: 700, flexShrink: 0 }}>
            <Plus size={18} /> Create New Job
          </button>
        </div>
      </div>

      {/* ── Jobs Grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {jobs.map(job => {
          const isActive = job.status === 'active';
          const [deptBg, deptColor] = getDeptColor(job.department);

          return (
            <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 22px', flex: 1 }}>
                {/* Dept + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px',
                    borderRadius: 99, background: deptBg, color: deptColor,
                    border: `1px solid ${deptColor}22`
                  }}>
                    <Layers size={10} /> {job.department}
                  </span>
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-closed'}`}>
                    <span className="dot-pulse" style={{ background: isActive ? '#059669' : '#94a3b8', width: 5, height: 5 }} />
                    {isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  {job.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {job.location} · {job.work_mode}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {job.min_experience}–{job.max_experience} yrs
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0284c7', fontWeight: 600 }}>
                    <Users size={12} /> {job.applicant_count || 0} applicants
                  </span>
                </div>

                {/* Skills */}
                <div>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                    Required Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {job.required_skills.slice(0, 5).map(sk => (
                      <span key={sk} className="chip chip-matched">{sk}</span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{job.required_skills.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 22px', borderTop: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--surface-subtle)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
              }}>
                <button onClick={() => onOpenPublicApply(job.public_token)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <Globe size={12} /> View Portal <ExternalLink size={11} />
                </button>
                <button onClick={() => onOpenShareModal(job)} className="btn btn-ghost btn-icon btn-sm" style={{ border: '1px solid var(--border-default)' }}>
                  <Share2 size={13} />
                </button>
                <button onClick={() => onToggleStatus(job.id)} className="btn btn-sm" style={{
                  background: isActive ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)',
                  color: isActive ? '#dc2626' : '#059669',
                  border: `1px solid ${isActive ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)'}`,
                  fontWeight: 600
                }}>
                  {isActive ? <><XCircle size={12} /> Pause</> : <><CheckCircle2 size={12} /> Activate</>}
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty */}
        {jobs.length === 0 && (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="card empty-state">
              <div className="empty-icon" style={{ background: 'rgba(99,102,241,0.08)' }}>
                <Plus size={22} color="#6366f1" />
              </div>
              <div className="empty-title">No job openings yet</div>
              <div className="empty-desc" style={{ marginBottom: 16 }}>Create your first job to start accepting AI-screened candidates</div>
              <button onClick={onOpenCreateJob} className="btn btn-primary btn-sm"><Plus size={14} /> Create First Job</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
