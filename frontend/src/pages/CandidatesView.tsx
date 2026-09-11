import React, { useState } from 'react';
import {
  Users, Sparkles, Trophy, Search, Medal, Building2,
  CheckCircle2, XCircle, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { Application, Job } from '../types';

interface CandidatesViewProps {
  applications: Application[];
  jobs: Job[];
  onSelectApplication: (app: Application) => void;
}

function getInitials(name: string) {
  return (name || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  applications, jobs, onSelectApplication
}) => {
  const [role, setRole]       = useState('');
  const [stage, setStage]     = useState('');
  const [minScore, setMin]    = useState(0);
  const [search, setSearch]   = useState('');

  const filtered = applications
    .filter(a => {
      if (role && a.job_id !== role) return false;
      if (stage && a.stage !== stage) return false;
      if (a.match_score < minScore) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.candidate?.full_name.toLowerCase().includes(q) ||
          a.matched_skills.some(s => s.toLowerCase().includes(q)) ||
          a.job?.title.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.match_score - a.match_score);

  const high = filtered.filter(a => a.match_score >= 85).length;
  const mid  = filtered.filter(a => a.match_score >= 70 && a.match_score < 85).length;
  const low  = filtered.filter(a => a.match_score < 70).length;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', icon: <Trophy size={12} /> };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: 'white', icon: <Medal size={12} /> };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', icon: null };
    return { bg: 'var(--surface-subtle)', color: 'var(--text-muted)', icon: null };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Score Distribution ──────────────────────────────────── */}
      <div className="grid-3">
        {[
          { label: 'High Match', count: high, desc: '≥ 85% AI Score', color: '#059669', bar: 'linear-gradient(90deg, #059669, #10b981)' },
          { label: 'Good Match', count: mid,  desc: '70–84% AI Score', color: '#4f46e5', bar: 'linear-gradient(90deg, #4f46e5, #6366f1)' },
          { label: 'Partial',    count: low,  desc: '< 70% AI Score', color: '#d97706', bar: 'linear-gradient(90deg, #d97706, #f59e0b)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {s.count}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <SlidersHorizontal size={14} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filters</span>
            </div>

            {/* Search */}
            <div className="input-with-icon" style={{ width: 200 }}>
              <span className="input-icon"><Search size={13} /></span>
              <input type="text" placeholder="Name or skill…" value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ height: 33, fontSize: '0.8rem' }} />
            </div>

            {/* Role */}
            <select value={role} onChange={e => setRole(e.target.value)} className="input" style={{ height: 33, fontSize: '0.8rem', width: 165 }}>
              <option value="">All Roles</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>

            {/* Stage */}
            <select value={stage} onChange={e => setStage(e.target.value)} className="input" style={{ height: 33, fontSize: '0.8rem', width: 145 }}>
              <option value="">All Stages</option>
              {['Applied','Screening','Shortlisted','Assessment','Technical Interview','HR Interview','Offer','Hired','Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Min Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Min:</span>
              <input type="range" min="0" max="95" step="5" value={minScore} onChange={e => setMin(+e.target.value)} style={{ width: 80 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', minWidth: 32 }}>{minScore}%</span>
            </div>
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> candidates
          </span>
        </div>
      </div>

      {/* ── Candidate List ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((app, i) => {
          const rank = i + 1;
          const rm = getRankBadge(rank);
          const s = app.match_score;
          const scoreClass = s >= 85 ? 'score-high' : s >= 70 ? 'score-mid' : 'score-low';
          return (
            <div key={app.id} className="card card-hover" style={{
              padding: '16px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              borderLeft: rank <= 3
                ? `4px solid ${rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#f97316'}`
                : '1px solid var(--border-default)'
            }} onClick={() => onSelectApplication(app)}>

              {/* Rank + Avatar + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                <div style={{
                  padding: '3px 9px', borderRadius: 7,
                  background: rm.bg, color: rm.color,
                  fontWeight: 800, fontSize: '0.73rem',
                  display: 'flex', alignItems: 'center', gap: 4,
                  flexShrink: 0, minWidth: 40, justifyContent: 'center',
                  boxShadow: rank <= 3 ? '0 2px 8px rgba(0,0,0,0.12)' : 'none'
                }}>
                  {rm.icon} #{rank}
                </div>

                <div className="avatar avatar-md">{getInitials(app.candidate?.full_name || 'NA')}</div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {app.candidate?.full_name}
                    </span>
                    <span className={`badge ${app.stage === 'Rejected' ? 'badge-rejected' : app.stage === 'Hired' ? 'badge-hired' : 'badge-shortlisted'}`}
                      style={{ fontSize: '0.65rem' }}>
                      {app.stage}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={11} /> {app.job?.title}
                    <span>·</span>
                    {app.candidate?.current_company || 'Candidate'}
                    <span>·</span>
                    {app.candidate?.total_experience_years}y exp
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260, flex: '0 0 auto' }}>
                {app.matched_skills.slice(0, 3).map(sk => (
                  <span key={sk} className="chip chip-matched" style={{ fontSize: '0.68rem' }}>
                    <CheckCircle2 size={9} /> {sk}
                  </span>
                ))}
                {app.missing_skills.length > 0 && (
                  <span className="chip chip-missing" style={{ fontSize: '0.68rem' }}>
                    <XCircle size={9} /> {app.missing_skills[0]}
                  </span>
                )}
              </div>

              {/* Score + Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <span className={`badge ${scoreClass}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                    <Sparkles size={11} /> {s}%
                  </span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>AI Match</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onSelectApplication(app); }}>
                  Inspect <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card empty-state">
            <div className="empty-icon"><Users size={22} color="#6366f1" /></div>
            <div className="empty-title">No candidates match these filters</div>
            <div className="empty-desc">Try loosening filters or reducing the minimum AI match threshold</div>
          </div>
        )}
      </div>
    </div>
  );
};
