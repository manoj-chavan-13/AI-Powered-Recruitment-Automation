import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, LayoutGrid, Users, ClipboardCheck,
  Calendar, Mail, ExternalLink, Sparkles, ShieldCheck, Zap, Activity
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  openPublicPortal: () => void;
}

const NAV = [
  { id: 'dashboard',   path: '/',            label: 'Dashboard',       sub: 'Analytics & KPIs',      Icon: LayoutDashboard },
  { id: 'jobs',        path: '/jobs',        label: 'Job Openings',     sub: 'Manage positions',       Icon: Briefcase       },
  { id: 'pipeline',    path: '/pipeline',    label: 'Pipeline Board',   sub: '8-stage Kanban',         Icon: LayoutGrid      },
  { id: 'candidates',  path: '/candidates',  label: 'AI Candidates',    sub: 'AI-ranked profiles',     Icon: Users           },
  { id: 'assessments', path: '/assessments', label: 'Assessments',      sub: 'Skills testing hub',     Icon: ClipboardCheck  },
  { id: 'interviews',  path: '/interviews',  label: 'Interviews',       sub: 'Schedule & scorecards',  Icon: Calendar        },
  { id: 'emails',      path: '/emails',      label: 'Email Logs',       sub: 'Automation audit',       Icon: Mail            },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, openPublicPortal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (id: string, path: string) => {
    if (setCurrentTab) setCurrentTab(id);
    navigate(path);
  };

  return (
    <aside className="sidebar">
      {/* ── Brand ──────────────────────────────────── */}
      <div className="sidebar-brand" onClick={() => handleNavClick('dashboard', '/')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">
          <Sparkles size={16} color="white" strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="brand-name">TalentIQ</div>
          <div className="brand-tagline">AI Recruitment Suite</div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="sidebar-nav" style={{ position: 'relative', zIndex: 1 }}>
        <div className="nav-section">Workspace</div>

        {NAV.map(({ id, path, label, sub, Icon }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard' || currentTab === 'dashboard'
              : location.pathname === path || location.pathname.startsWith(path + '/') || currentTab === id;

          return (
            <button
              key={id}
              onClick={() => handleNavClick(id, path)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className={`nav-item-icon ${isActive ? 'active' : ''}`}>
                <Icon
                  size={15}
                  color={isActive ? '#a5b4fc' : 'rgba(255,255,255,0.45)'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <div className="nav-item-text">
                <span className="nav-item-label">{label}</span>
                <span className="nav-item-sub">{sub}</span>
              </div>
              {isActive && (
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#6366f1', flexShrink: 0
                }} />
              )}
            </button>
          );
        })}

        {/* ── Portal Button ───────────────────────── */}
        <div className="nav-section" style={{ marginTop: 12 }}>Candidate Access</div>
        <button className="sidebar-portal-btn" onClick={openPublicPortal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(5,150,105,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ExternalLink size={13} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>
                Public Apply Portal
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(52,211,153,0.8)', marginTop: 2 }}>
                Live &amp; accepting apps
              </div>
            </div>
          </div>
          <div className="portal-live-dot">
            <div className="live-indicator" />
          </div>
        </button>
      </nav>

      {/* ── AI Status ──────────────────────────────── */}
      <div className="ai-status-chip">
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Zap size={13} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', lineHeight: 1.2 }}>
            AI Engine Active
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(165,180,252,0.6)', marginTop: 1 }}>
            Auto-parsing &amp; scoring on
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Activity size={13} color="#6366f1" />
        </div>
      </div>

      {/* ── User Footer ────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          SJ
          <div className="user-online" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="user-info-name">
            Sarah Jenkins
            <ShieldCheck size={11} color="#6366f1" style={{ display: 'inline', marginLeft: 5 }} />
          </span>
          <span className="user-info-role">Lead Talent Partner</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
