import React, { useState } from 'react';
import { X, Calendar, Video, Clock, User, Check, Sparkles } from 'lucide-react';
import { Application } from '../../types';

interface InterviewScheduleModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: any) => void;
}

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  application, isOpen, onClose, onSchedule
}) => {
  const [interviewType,   setType]         = useState<'Technical' | 'HR'>('Technical');
  const [title,           setTitle]        = useState('System Architecture & Concurrency Deep Dive');
  const [scheduledDate,   setDate]         = useState('2026-09-20');
  const [scheduledTime,   setTime]         = useState('14:00');
  const [duration,        setDuration]     = useState(45);
  const [interviewerName, setInterviewer]  = useState('Sarah Jenkins (Engineering Lead)');
  const [meetingLink,     setMeetingLink]  = useState('https://meet.google.com/ats-technical-round');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await onSchedule({
        application_id:    application.id,
        interview_type:    interviewType,
        title, scheduled_at: scheduledAt,
        duration_minutes:  duration,
        interviewer_name:  interviewerName,
        meeting_link:      meetingLink,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
              <Calendar size={17} color="white" />
            </div>
            <div>
              <div className="modal-title">Schedule Interview</div>
              <div className="modal-subtitle">
                For <strong style={{ color: '#4f46e5' }}>{application.candidate?.full_name}</strong>
                {' '}· {application.job?.title}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ border: '1px solid var(--border-default)' }}>
            <X size={17} color="var(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Interview Type toggle */}
            <div>
              <label className="form-label">Interview Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['Technical', 'HR'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)} className="btn" style={{
                    flex: 1, justifyContent: 'center',
                    background: interviewType === t ? (t === 'Technical' ? '#4f46e5' : '#d97706') : 'white',
                    color: interviewType === t ? 'white' : 'var(--text-secondary)',
                    border: interviewType === t ? 'none' : '1px solid var(--border-default)',
                    boxShadow: interviewType === t
                      ? `0 4px 12px ${t === 'Technical' ? 'rgba(79,70,229,0.3)' : 'rgba(217,119,6,0.3)'}`
                      : 'var(--shadow-xs)',
                  }}>
                    {t === 'Technical' ? '🔬' : '👥'} {t} Interview
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="form-label">Interview Session Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="input" />
            </div>

            {/* Date / Time */}
            <div className="grid-2">
              <div>
                <label className="form-label"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Scheduled Date</label>
                <input type="date" required value={scheduledDate} onChange={e => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="form-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Start Time</label>
                <input type="time" required value={scheduledTime} onChange={e => setTime(e.target.value)} className="input" />
              </div>
            </div>

            {/* Duration + Interviewer */}
            <div className="grid-2">
              <div>
                <label className="form-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Duration (minutes)</label>
                <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="input">
                  {[20, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className="form-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Lead Evaluator</label>
                <input type="text" required value={interviewerName} onChange={e => setInterviewer(e.target.value)} className="input" />
              </div>
            </div>

            {/* Meeting Link */}
            <div>
              <label className="form-label"><Video size={12} style={{ display: 'inline', marginRight: 4 }} />Meeting / Google Meet URL</label>
              <input type="url" required value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="input" placeholder="https://meet.google.com/..." />
            </div>

            {/* Auto-notification info */}
            <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>
              <Sparkles size={14} style={{ flexShrink: 0 }} />
              <span>Upon scheduling, an automated calendar invite email with the Google Meet link is sent to {application.candidate?.email}.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Scheduling…' : <><Check size={14} /> Confirm & Notify Candidate</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
