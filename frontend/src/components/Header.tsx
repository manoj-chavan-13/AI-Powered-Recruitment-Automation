import React from 'react';
import {
  Search, Plus, Share2, Bell, Filter, Sparkles, LayoutDashboard,
  Briefcase, LayoutGrid, Users, ClipboardCheck, Calendar, Mail
} from 'lucide-react';
import { Job } from '../types';

interface HeaderProps {
  currentTab: string;
  jobs: Job[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openCreateJobModal: () => void;
  openShareModal: () => void;
}

const TAB_META: Record<string, { title: string; desc: string; icon: React.ReactNode; badge?: string }> = {
  dashboard:   { title: 'Dashboard',       desc: 'Real-time pipeline analytics, AI insights & hiring velocity', icon: <LayoutDashboard size={16} />, badge: 'Live' },
  jobs:        { title: 'Job Openings',    desc: 'Manage active roles, requirements & shareable application portals', icon: <Briefcase size={16} /> },
  pipeline:    { title: 'Pipeline Board',  desc: 'Interactive 8-stage Kanban with automated candidate notifications', icon: <LayoutGrid size={16} /> },
  candidates:  { title: 'AI Candidates',   desc: 'Explainable AI match scores, skill gap analysis & profile comparison', icon: <Users size={16} />, badge: 'AI' },
  assessments: { title: 'Assessments',     desc: 'Objective skill tests, auto-scoring & benchmark evaluations', icon: <ClipboardCheck size={16} /> },
  interviews:  { title: 'Interviews',      desc: 'Technical & HR scheduling, Google Meet integration & scorecards', icon: <Calendar size={16} /> },
  emails:      { title: 'Email Logs',      desc: 'Zero-touch candidate communication audit trail', icon: <Mail size={16} /> },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab, jobs, selectedJobId, setSelectedJobId,
  searchQuery, setSearchQuery, openCreateJobModal, openShareModal
}) => {
  const meta = TAB_META[currentTab] ?? { title: 'TalentIQ', desc: 'AI-powered recruitment platform', icon: null };

  return (
    <header className="topbar">
      {/* Title */}
      <div className="topbar-title">
        <div className="topbar-heading">
          {meta.title}
          {meta.badge === 'Live' && (
            <span className="badge" style={{
              background: 'rgba(5,150,105,0.1)', color: '#059669',
              border: '1px solid rgba(5,150,105,0.2)', fontSize: '0.65rem'
            }}>
              <span className="dot-pulse" style={{ background: '#059669', width: 5, height: 5 }} />
              Live
            </span>
          )}
          {meta.badge === 'AI' && (
            <span className="badge" style={{
              background: 'rgba(99,102,241,0.1)', color: '#4f46e5',
              border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.65rem'
            }}>
              <Sparkles size={10} /> AI Powered
            </span>
          )}
        </div>
        <div className="topbar-sub">{meta.desc}</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div className="input-with-icon" style={{ width: 200 }}>
          <span className="input-icon"><Search size={14} /></span>
          <input
            type="text"
            placeholder="Search candidates…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            style={{ height: 36, fontSize: '0.82rem' }}
          />
        </div>

        {/* Job filter */}
        <div className="input-with-icon" style={{ width: 170 }}>
          <span className="input-icon"><Filter size={13} /></span>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="input"
            style={{ height: 36, fontSize: '0.82rem', paddingLeft: 32 }}
          >
            <option value="">All Roles</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div className="divider-v" />

        {/* Share */}
        <button onClick={openShareModal} className="btn btn-secondary btn-sm">
          <Share2 size={14} /> Share
        </button>

        {/* New Job */}
        <button onClick={openCreateJobModal} className="btn btn-primary btn-sm">
          <Plus size={15} /> New Job
        </button>

        {/* Bell */}
        <button className="btn btn-ghost btn-icon btn-sm" style={{ position: 'relative', border: '1px solid var(--border-default)' }}>
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 6, height: 6, borderRadius: '50%',
            background: '#dc2626', border: '1.5px solid white'
          }} />
        </button>
      </div>
    </header>
  );
};
