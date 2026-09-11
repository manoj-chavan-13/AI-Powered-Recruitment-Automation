import React, { useState } from 'react';
import {
  Calendar, Video, Clock, CheckCircle2, XCircle, Star,
  Plus, MessageSquare, Sparkles
} from 'lucide-react';
import { Interview, Application } from '../types';

interface InterviewsViewProps {
  interviews: Interview[];
  applications: Application[];
  onOpenScheduleModal: (app?: Application) => void;
  onRecordFeedback: (id: string, rating: number, feedback: string, result: string) => Promise<any>;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  interviews, applications, onOpenScheduleModal, onRecordFeedback
}) => {
  const [selected, setSelected]   = useState<Interview | null>(null);
  const [rating, setRating]       = useState(4);
  const [feedback, setFeedback]   = useState('Strong technical depth in async concurrency and system design.');
  const [result, setResult]       = useState<'passed' | 'failed'>('passed');
  const [saving, setSaving]       = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try { await onRecordFeedback(selected.id, rating, feedback, result); setSelected(null); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const scheduled  = interviews.filter(i => i.result === 'pending').length;
  const completed  = interviews.filter(i => i.result !== 'pending').length;
  const passCount  = interviews.filter(i => i.result === 'passed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="page-banner violet" style={{ position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div className="banner-eyebrow"><Sparkles size={12} /> Interview Orchestration</div>
            <h2 className="banner-title">Scheduling & Scorecards</h2>
            <p className="banner-desc">Submitting scorecards auto-notifies candidates and triggers the next lifecycle stage.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {[
              { label: 'Scheduled', value: scheduled },
              { label: 'Completed', value: completed },
              { label: 'Passed',    value: passCount  },
            ].map(s => (
              <div key={s.label} className="banner-stat">
                <span className="banner-stat-value">{s.value}</span>
                <span className="banner-stat-label">{s.label}</span>
              </div>
            ))}
            <button onClick={() => onOpenScheduleModal()} className="btn btn-lg" style={{ background: 'white', color: '#7c3aed', fontWeight: 700 }}>
              <Plus size={16} /> Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {interviews.map(item => {
          const isPending = item.result === 'pending';
          const isTech = item.interview_type === 'Technical';
          const typeColor  = isTech ? '#4f46e5' : '#d97706';
          const typeBg     = isTech ? 'rgba(99,102,241,0.08)' : 'rgba(217,119,6,0.08)';
          const resultColor = isPending ? '#4f46e5' : item.result === 'passed' ? '#059669' : '#dc2626';
          const resultBg    = isPending ? 'rgba(99,102,241,0.08)' : item.result === 'passed' ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)';

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 20px', flex: 1 }}>
                {/* Type + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: typeBg, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isTech ? '🔬' : '👥'} {item.interview_type}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: resultBg, color: resultColor }}>
                    {isPending && <span className="dot-pulse" style={{ background: resultColor, width: 5, height: 5 }} />}
                    {isPending ? 'Scheduled' : item.result === 'passed' ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {item.title}
                </h3>

                {/* Date / Time */}
                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {new Date(item.scheduled_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.duration_minutes}min
                  </span>
                </div>

                {/* Evaluator */}
                <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--surface-subtle)', border: '1px solid var(--border-light)', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Lead Evaluator</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="avatar avatar-sm">{(item.interviewer_name || 'EV').charAt(0)}</div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.interviewer_name}</span>
                  </div>
                </div>

                {/* Stars if completed */}
                {!isPending && item.rating && (
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} fill={n <= item.rating! ? '#f59e0b' : 'none'} color={n <= item.rating! ? '#f59e0b' : 'var(--border-medium)'} />
                    ))}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>{item.rating}/5</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '11px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8, background: 'var(--surface-subtle)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                {item.meeting_link && (
                  <a href={item.meeting_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    <Video size={13} /> Launch Meet
                  </a>
                )}
                <button onClick={() => setSelected(item)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  <MessageSquare size={13} /> {isPending ? 'Scorecard' : 'View Notes'}
                </button>
              </div>
            </div>
          );
        })}

        {interviews.length === 0 && (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="card empty-state">
              <div className="empty-icon"><Calendar size={22} color="#6366f1" /></div>
              <div className="empty-title">No interviews scheduled</div>
              <div className="empty-desc" style={{ marginBottom: 14 }}>Schedule from Pipeline board or Candidates view</div>
              <button onClick={() => onOpenScheduleModal()} className="btn btn-primary btn-sm"><Plus size={14} /> Schedule</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Scorecard Modal ──────────────────────────────────────── */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Interview Scorecard</div>
                <div className="modal-subtitle">{selected.title}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                <XCircle size={18} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Stars rating */}
                <div>
                  <label className="form-label">Performance Rating</label>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <Star size={24} fill={n <= rating ? '#f59e0b' : 'none'} color={n <= rating ? '#f59e0b' : 'var(--border-medium)'} />
                      </button>
                    ))}
                    <span style={{ alignSelf: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 6 }}>{rating}/5</span>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="form-label">Evaluation Notes & Feedback</label>
                  <textarea rows={4} required value={feedback} onChange={e => setFeedback(e.target.value)}
                    className="input" placeholder="Detail problem-solving, communication, architecture awareness…" style={{ resize: 'vertical' }} />
                </div>

                {/* Recommendation */}
                <div>
                  <label className="form-label">Panel Recommendation</label>
                  <div className="grid-2">
                    <button type="button" onClick={() => setResult('passed')} className="btn" style={{
                      background: result === 'passed' ? '#059669' : 'white',
                      color: result === 'passed' ? 'white' : 'var(--text-secondary)',
                      border: result === 'passed' ? 'none' : '1px solid var(--border-default)',
                      boxShadow: result === 'passed' ? '0 4px 12px rgba(5,150,105,0.35)' : 'var(--shadow-xs)',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={15} /> Pass (Advance)
                    </button>
                    <button type="button" onClick={() => setResult('failed')} className="btn" style={{
                      background: result === 'failed' ? '#dc2626' : 'white',
                      color: result === 'failed' ? 'white' : 'var(--text-secondary)',
                      border: result === 'failed' ? 'none' : '1px solid var(--border-default)',
                      boxShadow: result === 'failed' ? '0 4px 12px rgba(220,38,38,0.35)' : 'var(--shadow-xs)',
                      justifyContent: 'center'
                    }}>
                      <XCircle size={15} /> Fail (Reject)
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelected(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Saving…' : '✓ Submit Scorecard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
