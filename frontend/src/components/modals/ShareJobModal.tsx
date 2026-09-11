import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Globe, Link2 } from 'lucide-react';
import { Job } from '../../types';

interface ShareJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onOpenPublicApply: (token: string) => void;
}

export const ShareJobModal: React.FC<ShareJobModalProps> = ({ isOpen, onClose, jobs, onOpenPublicApply }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(jobs[0] || null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentJob = selectedJob || jobs[0];
  const publicUrl = currentJob
    ? `${window.location.origin}/careers/${currentJob.public_token}`
    : `${window.location.origin}/careers/demo`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2,132,199,0.35)' }}>
              <Globe size={17} color="white" />
            </div>
            <div>
              <div className="modal-title">Share Application Link</div>
              <div className="modal-subtitle">Unique candidate portal with deadline & AI screening</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ border: '1px solid var(--border-default)' }}>
            <X size={17} color="var(--text-muted)" />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Job Picker */}
          <div>
            <label className="form-label">Select Job Opening</label>
            <select value={currentJob?.id} onChange={e => { const j = jobs.find(x => x.id === e.target.value); if (j) setSelectedJob(j); }} className="input">
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          {/* URL Display */}
          <div>
            <label className="form-label">Candidate Application URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '9px 14px', background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {publicUrl}
              </div>
              <button onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                {copied ? <><Check size={14} color="#059669" /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Info card */}
          <div style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4338ca', marginBottom: 8 }}>
              🔒 What this link does
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                'Candidates upload resume directly — no login needed',
                'AI parses and scores resume in &lt; 5 seconds',
                'Application receipt email auto-dispatched',
                'Deadline enforced — expired links automatically deactivate',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                  <span style={{ color: '#6366f1', fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Job details summary */}
          {currentJob && (
            <div style={{ padding: '12px 16px', background: 'var(--surface-subtle)', borderRadius: 10, border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{currentJob.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{currentJob.department} · {currentJob.location} · {currentJob.work_mode}</div>
                </div>
                <span className={`badge ${currentJob.status === 'active' ? 'badge-active' : 'badge-closed'}`}>
                  {currentJob.status}
                </span>
              </div>
              {currentJob.deadline && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Deadline: {new Date(currentJob.deadline).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
          {currentJob && (
            <button onClick={() => { onOpenPublicApply(currentJob.public_token); onClose(); }} className="btn btn-primary btn-sm">
              <Link2 size={14} /> Open Portal <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
