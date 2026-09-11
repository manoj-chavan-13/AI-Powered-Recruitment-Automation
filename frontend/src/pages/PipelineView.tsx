import React, { useMemo, useState } from 'react';
import {
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Building2,
  Briefcase,
  ArrowUpRight,
  Search,
  RotateCcw,
  X,
  GraduationCap,
  Clock,
  GripVertical,
  Check,
  Eye,
  Send,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Application } from '../types';

interface PipelineViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onUpdateStage: (appId: string, stage: string, notes?: string) => void;
}

/* ──────────────────────────────────────────────────────────────────────────
   PIPELINE STAGE DEFINITIONS
   ────────────────────────────────────────────────────────────────────────── */

interface StageMeta {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  softBg: string;
  badgeBg: string;
  badgeColor: string;
  actionText: string;
}

const PIPELINE_STAGES: StageMeta[] = [
  {
    id: 'Applied',
    label: 'Applied',
    shortLabel: 'Applied',
    description: 'New incoming resumes',
    accentColor: '#6366f1',
    softBg: '#f5f3ff',
    badgeBg: '#ede9fe',
    badgeColor: '#4f46e5',
    actionText: 'Screening',
  },
  {
    id: 'Screening',
    label: 'Screening',
    shortLabel: 'Screening',
    description: 'Resume & qualifications match',
    accentColor: '#8b5cf6',
    softBg: '#faf5ff',
    badgeBg: '#f3e8ff',
    badgeColor: '#7c3aed',
    actionText: 'Shortlist',
  },
  {
    id: 'Shortlisted',
    label: 'Shortlisted',
    shortLabel: 'Shortlist',
    description: 'Cleared initial screening',
    accentColor: '#2563eb',
    softBg: '#eff6ff',
    badgeBg: '#dbeafe',
    badgeColor: '#1d4ed8',
    actionText: 'Assessment',
  },
  {
    id: 'Assessment',
    label: 'Assessment',
    shortLabel: 'Assessment',
    description: 'Online test link auto-sent',
    accentColor: '#0891b2',
    softBg: '#ecfeff',
    badgeBg: '#cffafe',
    badgeColor: '#0e7490',
    actionText: 'Tech Round',
  },
  {
    id: 'Technical Interview',
    label: 'Technical Interview',
    shortLabel: 'Tech Round',
    description: 'Live coding & Meet link',
    accentColor: '#d97706',
    softBg: '#fffbeb',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    actionText: 'HR Round',
  },
  {
    id: 'HR Interview',
    label: 'HR Interview',
    shortLabel: 'HR Round',
    description: 'Culture & compensation fit',
    accentColor: '#db2777',
    softBg: '#fdf2f8',
    badgeBg: '#fce7f3',
    badgeColor: '#be185d',
    actionText: 'Send Offer',
  },
  {
    id: 'Offer',
    label: 'Offer',
    shortLabel: 'Offer',
    description: 'Offer letter extended',
    accentColor: '#059669',
    softBg: '#ecfdf5',
    badgeBg: '#d1fae5',
    badgeColor: '#047857',
    actionText: 'Mark Hired',
  },
  {
    id: 'Hired',
    label: 'Hired',
    shortLabel: 'Hired',
    description: 'Offer accepted & joined',
    accentColor: '#16a34a',
    softBg: '#f0fdf4',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    actionText: 'Completed',
  },
];

const REJECT_REASONS = [
  'Skills do not meet role criteria',
  'Total experience below required threshold',
  'Assessment test score below cutoff',
  'Candidate salary expectation out of range',
  'Candidate declined / withdrew',
  'Role has already been filled',
];

function getInitials(name?: string) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name?: string) {
  const colors = [
    { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
    { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
    { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
  ];
  if (!name) return colors[0];
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return colors[charCode % colors.length];
}

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      label: 'High Match',
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0',
      dot: '#10b981',
    };
  }
  if (score >= 70) {
    return {
      label: 'Good Match',
      bg: '#eff6ff',
      text: '#2563eb',
      border: '#bfdbfe',
      dot: '#3b82f6',
    };
  }
  return {
    label: 'Partial Match',
    bg: '#fffbeb',
    text: '#d97706',
    border: '#fde68a',
    dot: '#f59e0b',
  };
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  applications,
  onSelectApplication,
  onUpdateStage,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'good'>('all');
  const [showArchivedRejected, setShowArchivedRejected] = useState(false);

  // Drag and Drop state
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalApp, setRejectModalApp] = useState<Application | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState(REJECT_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');

  /* --------------------------------------------------------------------------
     Derived Datasets
  -------------------------------------------------------------------------- */

  const activeApplications = useMemo(
    () => applications.filter((app) => app.stage !== 'Rejected'),
    [applications]
  );

  const rejectedApplications = useMemo(
    () => applications.filter((app) => app.stage === 'Rejected'),
    [applications]
  );

  const availableRoles = useMemo(() => {
    const rolesMap = new Map<string, string>();
    applications.forEach((app) => {
      if (app.job?.id && app.job?.title) {
        rolesMap.set(app.job.id, app.job.title);
      }
    });
    return Array.from(rolesMap.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  // Filtered applications
  const filteredActiveApps = useMemo(() => {
    return activeApplications.filter((app) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (app.candidate?.full_name || '').toLowerCase();
        const comp = (app.candidate?.current_company || '').toLowerCase();
        const role = (app.job?.title || '').toLowerCase();
        const skills = (app.matched_skills || []).join(' ').toLowerCase();

        if (
          !name.includes(q) &&
          !comp.includes(q) &&
          !role.includes(q) &&
          !skills.includes(q)
        ) {
          return false;
        }
      }

      // Role filter
      if (selectedRole !== 'all' && app.job_id !== selectedRole) {
        return false;
      }

      // Score filter
      const score = app.match_score || 0;
      if (scoreFilter === 'high' && score < 85) return false;
      if (scoreFilter === 'good' && score < 70) return false;

      return true;
    });
  }, [activeApplications, searchQuery, selectedRole, scoreFilter]);

  // Key stats
  const totalActive = activeApplications.length;
  const highMatchCount = useMemo(
    () => activeApplications.filter((a) => (a.match_score || 0) >= 85).length,
    [activeApplications]
  );
  const assessmentCount = useMemo(
    () => activeApplications.filter((a) => a.stage === 'Assessment').length,
    [activeApplications]
  );
  const hiredCount = useMemo(
    () => activeApplications.filter((a) => a.stage === 'Hired').length,
    [activeApplications]
  );

  /* --------------------------------------------------------------------------
     Stage Transition Controls
  -------------------------------------------------------------------------- */

  const handleAdvance = (app: Application) => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === app.stage);
    if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1].id;
      onUpdateStage(app.id, nextStage);
    }
  };

  const handleRetreat = (app: Application) => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === app.stage);
    if (currentIndex > 0) {
      const prevStage = PIPELINE_STAGES[currentIndex - 1].id;
      onUpdateStage(app.id, prevStage);
    }
  };

  const confirmRejection = () => {
    if (!rejectModalApp) return;
    const finalReason = customRejectReason.trim()
      ? customRejectReason.trim()
      : selectedRejectReason;
    onUpdateStage(rejectModalApp.id, 'Rejected', finalReason);
    setRejectModalApp(null);
    setCustomRejectReason('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      const app = applications.find((a) => a.id === appId);
      if (app && app.stage !== targetStageId) {
        onUpdateStage(appId, targetStageId);
      }
    }
    setDraggedAppId(null);
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedRole !== 'all' || scoreFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole('all');
    setScoreFilter('all');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ────────────────────────────────────────────────────────────────────
          HEADER & METRICS ROW
          ──────────────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '22px 26px',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {/* Left Title & Status */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: '99px',
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#4f46e5',
                }}
              />
              TALENTIQ RECRUITMENT PIPELINE
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Candidate Pipeline
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'var(--surface-subtle)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  border: '1px solid var(--border-default)',
                }}
              >
                {totalActive} Active In-Flight
              </span>
            </h1>

            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-tertiary)',
                margin: '4px 0 0 0',
              }}
            >
              Interactive Kanban board with drag-and-drop. Advancing candidates automatically triggers stage emails, test links, and Google Meet scheduling.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 135,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {totalActive}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  Active Pipeline
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 135,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#059669',
                    lineHeight: 1,
                  }}
                >
                  {highMatchCount}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  Top AI Matches
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 135,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: '#ecfeff',
                  color: '#0891b2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0891b2',
                    lineHeight: 1,
                  }}
                >
                  {assessmentCount}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  In Assessment
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 135,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#16a34a',
                    lineHeight: 1,
                  }}
                >
                  {hiredCount}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  Hired Offers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proportional Stage Flow Bar */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pipeline Distribution
            </span>
            <span>{totalActive} candidates in workflow</span>
          </div>

          <div
            style={{
              width: '100%',
              height: 7,
              background: 'var(--surface-subtle)',
              borderRadius: 99,
              overflow: 'hidden',
              display: 'flex',
              gap: 2,
            }}
          >
            {PIPELINE_STAGES.map((s) => {
              const count = activeApplications.filter((a) => a.stage === s.id).length;
              if (count === 0 || totalActive === 0) return null;
              const pct = (count / totalActive) * 100;
              return (
                <div
                  key={s.id}
                  style={{
                    width: `${pct}%`,
                    background: s.accentColor,
                    borderRadius: 99,
                    transition: 'width 0.3s ease',
                  }}
                  title={`${s.label}: ${count} candidates (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          SEARCH & FILTER CONTROLS TOOLBAR
          ──────────────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Left Inputs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flex: 1 }}>
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                width: 240,
                minWidth: 200,
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search candidate or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{
                  paddingLeft: 32,
                  height: 35,
                  fontSize: '0.8rem',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input"
              style={{ height: 35, fontSize: '0.8rem', minWidth: 170 }}
            >
              <option value="all">All Roles</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            {/* Score Threshold */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value as any)}
              className="input"
              style={{ height: 35, fontSize: '0.8rem', minWidth: 155 }}
            >
              <option value="all">All AI Scores</option>
              <option value="high">≥ 85% High Match</option>
              <option value="good">≥ 70% Good Match</option>
            </select>

            {/* Clear button if active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary"
                style={{
                  height: 35,
                  padding: '0 12px',
                  fontSize: '0.78rem',
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                }}
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Right: Archived Rejections Toggle */}
          <button
            type="button"
            onClick={() => setShowArchivedRejected(!showArchivedRejected)}
            className="btn btn-secondary"
            style={{
              height: 35,
              padding: '0 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: showArchivedRejected ? '#fee2e2' : 'white',
              color: showArchivedRejected ? '#dc2626' : 'var(--text-secondary)',
              borderColor: showArchivedRejected ? '#fca5a5' : 'var(--border-default)',
            }}
          >
            <XCircle size={14} color="#dc2626" />
            {showArchivedRejected ? 'Hide Rejections' : 'Archived Rejections'}
            <span
              style={{
                marginLeft: 4,
                padding: '1px 6px',
                borderRadius: 99,
                fontSize: '0.7rem',
                fontWeight: 700,
                background: showArchivedRejected ? '#dc2626' : 'rgba(220,38,38,0.1)',
                color: showArchivedRejected ? 'white' : '#dc2626',
              }}
            >
              {rejectedApplications.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          ARCHIVED REJECTIONS ACCORDION / DRAWER
          ──────────────────────────────────────────────────────────────────── */}
      {showArchivedRejected && (
        <div
          className="card"
          style={{
            padding: '20px 24px',
            background: '#fffbfb',
            border: '1px solid #fed7d7',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
                  Archived Rejected Applicants ({rejectedApplications.length})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                  Candidates disqualified or withdrew. You can restore them to Applied stage at any time.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowArchivedRejected(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#991b1b',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {rejectedApplications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
              }}
            >
              No candidates currently archived in Rejected stage.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {rejectedApplications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: 'white',
                    border: '1px solid #fee2e2',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        {app.candidate?.full_name || 'Candidate'}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#dc2626',
                          background: '#fef2f2',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Rejected
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {app.job?.title || 'General Applicant'}
                    </div>

                    {app.rejection_reason && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#b91c1c',
                          background: '#fff5f5',
                          border: '1px solid #fee2e2',
                          borderRadius: 4,
                          padding: '4px 8px',
                          marginTop: 8,
                        }}
                      >
                        {app.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: '1px solid #fef2f2',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectApplication(app)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--brand-600)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Eye size={12} />
                      View Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateStage(app.id, 'Applied')}
                      className="btn btn-secondary"
                      style={{
                        height: 26,
                        padding: '0 8px',
                        fontSize: '0.7rem',
                      }}
                    >
                      Restore to Applied
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          KANBAN BOARD COLUMNS (HORIZONTAL SCROLL)
          ──────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            minWidth: 2360,
          }}
        >
          {PIPELINE_STAGES.map((stage, colIndex) => {
            const columnApps = filteredActiveApps.filter((a) => a.stage === stage.id);
            const isDragTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{
                  width: 280,
                  minWidth: 280,
                  maxWidth: 280,
                  background: isDragTarget ? '#f0f4ff' : 'var(--surface-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  border: isDragTarget
                    ? '2px dashed var(--brand-500)'
                    : '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 280px)',
                  minHeight: 520,
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '14px 16px 12px 16px',
                    background: 'white',
                    borderBottom: '1px solid var(--border-default)',
                    position: 'relative',
                  }}
                >
                  {/* Top colored accent stripe */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: stage.accentColor,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: stage.accentColor,
                          boxShadow: `0 0 0 3px ${stage.softBg}`,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 750,
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: stage.badgeBg,
                        color: stage.badgeColor,
                      }}
                    >
                      {columnApps.length}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginTop: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{stage.description}</span>
                    <span style={{ fontWeight: 600 }}>
                      {colIndex + 1}/{PIPELINE_STAGES.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {columnApps.length === 0 ? (
                    <div
                      style={{
                        border: '1.5px dashed var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        padding: '36px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Users size={18} style={{ opacity: 0.4 }} />
                      <div style={{ fontSize: '0.76rem', fontWeight: 600 }}>No candidates</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                        Drag candidates here to advance
                      </div>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const candidate = app.candidate;
                      const score = app.match_score || 0;
                      const tone = getScoreTone(score);
                      const avatar = getAvatarColor(candidate?.full_name);
                      const skills = app.matched_skills || [];

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onClick={() => onSelectApplication(app)}
                          className="card"
                          style={{
                            padding: '12px 14px',
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            boxShadow: 'var(--shadow-xs)',
                            cursor: 'grab',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            e.currentTarget.style.borderColor = 'var(--brand-200)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                          }}
                        >
                          {/* Card Top: Avatar, Name & AI Match */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: avatar.bg,
                                  color: avatar.text,
                                  border: `1px solid ${avatar.border}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(candidate?.full_name)}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 750,
                                    fontSize: '0.84rem',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {candidate?.full_name || 'Anonymous'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {app.job?.title || 'Open Position'}
                                </div>
                              </div>
                            </div>

                            {/* AI Match Badge */}
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: tone.bg,
                                color: tone.text,
                                border: `1px solid ${tone.border}`,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                              title={`AI Fit Score: ${score}% (${tone.label})`}
                            >
                              <Sparkles size={10} />
                              {score}%
                            </div>
                          </div>

                          {/* Candidate Company & Experience */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary)',
                              marginTop: 9,
                            }}
                          >
                            <Building2 size={11} color="var(--text-muted)" />
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 125,
                              }}
                            >
                              {candidate?.current_company || 'Candidate'}
                            </span>
                            <span style={{ color: 'var(--border-medium)' }}>•</span>
                            <Briefcase size={11} color="var(--text-muted)" />
                            <span>{candidate?.total_experience_years ?? 0}y exp</span>
                          </div>

                          {/* Skills Pills */}
                          {skills.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 4,
                                marginTop: 8,
                              }}
                            >
                              {skills.slice(0, 2).map((s) => (
                                <span
                                  key={s}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: 'var(--surface-subtle)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {skills.length > 2 && (
                                <span
                                  style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: '#eef2ff',
                                    color: '#4f46e5',
                                  }}
                                >
                                  +{skills.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Stage-specific micro status */}
                          {stage.id === 'Assessment' && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#ecfeff',
                                border: '1px solid #cffafe',
                                color: '#0891b2',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>Assessment link active</span>
                              <Send size={10} />
                            </div>
                          )}

                          {stage.id === 'Technical Interview' && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#fffbeb',
                                border: '1px solid #fef3c7',
                                color: '#b45309',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>Google Meet scheduled</span>
                              <Calendar size={10} />
                            </div>
                          )}

                          {/* Card Action Controls Footer */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: 10,
                              paddingTop: 8,
                              borderTop: '1px solid var(--border-light)',
                            }}
                          >
                            {/* Left: Move Prev or Reject */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {colIndex > 0 ? (
                                <button
                                  type="button"
                                  title={`Move back to ${PIPELINE_STAGES[colIndex - 1].shortLabel}`}
                                  onClick={() => handleRetreat(app)}
                                  className="btn btn-secondary"
                                  style={{
                                    width: 26,
                                    height: 26,
                                    padding: 0,
                                    borderRadius: 6,
                                  }}
                                >
                                  <ChevronLeft size={13} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="View profile"
                                  onClick={() => onSelectApplication(app)}
                                  className="btn btn-secondary"
                                  style={{
                                    width: 26,
                                    height: 26,
                                    padding: 0,
                                    borderRadius: 6,
                                  }}
                                >
                                  <ArrowUpRight size={13} />
                                </button>
                              )}

                              {/* Reject button */}
                              <button
                                type="button"
                                title="Reject candidate with feedback"
                                onClick={() => setRejectModalApp(app)}
                                className="btn btn-secondary"
                                style={{
                                  width: 26,
                                  height: 26,
                                  padding: 0,
                                  borderRadius: 6,
                                  color: '#dc2626',
                                }}
                              >
                                <XCircle size={13} />
                              </button>
                            </div>

                            {/* Right: Advance Stage */}
                            {colIndex < PIPELINE_STAGES.length - 1 ? (
                              <button
                                type="button"
                                title={`Advance to ${PIPELINE_STAGES[colIndex + 1].label}`}
                                onClick={() => handleAdvance(app)}
                                className="btn btn-primary"
                                style={{
                                  height: 26,
                                  padding: '0 10px',
                                  fontSize: '0.72rem',
                                  borderRadius: 6,
                                }}
                              >
                                <span>{stage.actionText}</span>
                                <ChevronRight size={11} />
                              </button>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#16a34a',
                                  background: '#f0fdf4',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                <Check size={11} />
                                Hired
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          REJECT CANDIDATE MODAL
          ──────────────────────────────────────────────────────────────────── */}
      {rejectModalApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: '24px 28px',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <XCircle size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 750,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Reject Candidate
                  </h3>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    Archive applicant and record recruiter feedback
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRejectModalApp(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Candidate Summary */}
            <div
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                {rejectModalApp.candidate?.full_name || 'Candidate'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {rejectModalApp.job?.title || 'Open Role'} • Stage: {rejectModalApp.stage}
              </div>
            </div>

            {/* Reason Selection */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Select Rejection Reason
              </label>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {REJECT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRejectReason(r);
                      setCustomRejectReason('');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: '0.76rem',
                      border:
                        selectedRejectReason === r && !customRejectReason
                          ? '1.5px solid #dc2626'
                          : '1px solid var(--border-default)',
                      background:
                        selectedRejectReason === r && !customRejectReason
                          ? '#fff5f5'
                          : 'white',
                      color:
                        selectedRejectReason === r && !customRejectReason
                          ? '#991b1b'
                          : 'var(--text-secondary)',
                      fontWeight: selectedRejectReason === r && !customRejectReason ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 4,
                  }}
                >
                  Or Custom Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs more years of backend experience..."
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: 35, fontSize: '0.78rem' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 12,
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="btn btn-secondary"
                style={{ height: 36, padding: '0 16px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                className="btn btn-danger"
                style={{ height: 36, padding: '0 16px', fontSize: '0.8rem' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineView;