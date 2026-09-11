import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { Job } from '../../types';

interface JobCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (jobData: Partial<Job>) => void;
}

export const JobCreateModal: React.FC<JobCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title,         setTitle]         = useState('');
  const [department,    setDepartment]    = useState('AI & Platform Engineering');
  const [description,   setDescription]  = useState('');
  const [location,      setLocation]     = useState('San Francisco, CA / Remote');
  const [workMode,      setWorkMode]      = useState('Remote');
  const [employmentType,setEmpType]       = useState('Full-time');
  const [minExp,        setMinExp]        = useState(3.0);
  const [maxExp,        setMaxExp]        = useState(8.0);
  const [education,     setEducation]     = useState("Bachelor's or Master's in Computer Science");
  const [deadlineDays,  setDeadlineDays]  = useState(30);
  const [reqSkillInput, setReqInput]      = useState('');
  const [requiredSkills, setReqSkills]   = useState<string[]>(['Python', 'FastAPI', 'PostgreSQL', 'Docker']);
  const [prefSkillInput, setPrefInput]   = useState('');
  const [preferredSkills, setPrefSkills] = useState<string[]>(['PyTorch', 'AWS', 'Redis']);

  if (!isOpen) return null;

  const addSkill = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void, e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const val = input.replace(',', '').trim();
      if (!list.includes(val)) setList([...list, val]);
      setInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { alert('Fill out job title and description.'); return; }
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);
    onCreate({
      title, department, description, location,
      work_mode: workMode, employment_type: employmentType,
      min_experience: minExp, max_experience: maxExp, education,
      required_skills: requiredSkills, preferred_skills: preferredSkills,
      deadline: deadline.toISOString(), status: 'active'
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <Sparkles size={17} color="white" />
            </div>
            <div>
              <div className="modal-title">Create New Job Opening</div>
              <div className="modal-subtitle">Auto-provisions encrypted candidate portal with AI parsing</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ border: '1px solid var(--border-default)' }}>
            <X size={17} color="var(--text-muted)" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title + Dept */}
            <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div>
                <label className="form-label">Job Title *</label>
                <input type="text" required placeholder="e.g. Senior ML Engineer" value={title} onChange={e => setTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="input">
                  <option>AI & Platform Engineering</option>
                  <option>Product Experience</option>
                  <option>Core Infrastructure</option>
                  <option>Data Science & Analytics</option>
                  <option>Security & Compliance</option>
                  <option>Design & Brand</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Job Description & Responsibilities *</label>
              <textarea required rows={3} placeholder="Outline core responsibilities, milestones, and architectural impact…" value={description} onChange={e => setDescription(e.target.value)} className="input" style={{ resize: 'vertical' }} />
            </div>

            {/* Required Skills */}
            <div>
              <label className="form-label">Required Skills — Press Enter to add *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, minHeight: 44, alignItems: 'center', transition: 'border-color 0.15s' }}>
                {requiredSkills.map(s => (
                  <span key={s} className="chip chip-matched">
                    {s}
                    <button type="button" onClick={() => setReqSkills(requiredSkills.filter(x => x !== s))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', marginLeft: 2, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
                <input type="text" placeholder={requiredSkills.length === 0 ? 'Type skill & press Enter…' : 'Add more…'} value={reqSkillInput}
                  onChange={e => setReqInput(e.target.value)} onKeyDown={e => addSkill(requiredSkills, setReqSkills, reqSkillInput, setReqInput, e)}
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, minWidth: 120 }} />
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="form-label">Preferred / Nice-to-have Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, minHeight: 44, alignItems: 'center' }}>
                {preferredSkills.map(s => (
                  <span key={s} className="chip chip-neutral">
                    {s}
                    <button type="button" onClick={() => setPrefSkills(preferredSkills.filter(x => x !== s))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', marginLeft: 2, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
                <input type="text" placeholder="Add preferred skill…" value={prefSkillInput}
                  onChange={e => setPrefInput(e.target.value)} onKeyDown={e => addSkill(preferredSkills, setPrefSkills, prefSkillInput, setPrefInput, e)}
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, minWidth: 120 }} />
              </div>
            </div>

            {/* Experience + Education */}
            <div className="grid-3">
              <div>
                <label className="form-label">Min Experience (yrs)</label>
                <input type="number" step="0.5" min="0" value={minExp} onChange={e => setMinExp(parseFloat(e.target.value) || 0)} className="input" />
              </div>
              <div>
                <label className="form-label">Max Experience (yrs)</label>
                <input type="number" step="0.5" min="0" value={maxExp} onChange={e => setMaxExp(parseFloat(e.target.value) || 5)} className="input" />
              </div>
              <div>
                <label className="form-label">Education Requirement</label>
                <input type="text" value={education} onChange={e => setEducation(e.target.value)} className="input" />
              </div>
            </div>

            {/* Location + Work Mode + Deadline */}
            <div className="grid-3">
              <div>
                <label className="form-label">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input" />
              </div>
              <div>
                <label className="form-label">Work Mode</label>
                <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="input">
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                </select>
              </div>
              <div>
                <label className="form-label">Deadline (days)</label>
                <input type="number" min="1" max="180" value={deadlineDays} onChange={e => setDeadlineDays(parseInt(e.target.value) || 30)} className="input" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={15} /> Publish & Generate Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
