import React from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  Target,
  Zap,
  BarChart3,
  ArrowRight,
  CalendarDays,
  MoreHorizontal,
  UserRound,
} from 'lucide-react';
import { DashboardStats, Application } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  onSelectApplication: (app: Application) => void;
  onNavigateToJobs: () => void;
  onNavigateToPipeline: () => void;
  onNavigateToCandidates: () => void;
}

/* -------------------------------------------------------------------------- */
/* Pipeline stages                                                             */
/* -------------------------------------------------------------------------- */

const STAGES = [
  {
    key: 'Applied',
    label: 'Applied',
    color: '#6366F1',
    soft: '#F0EFFF',
  },
  {
    key: 'Screening',
    label: 'Screening',
    color: '#8B5CF6',
    soft: '#F5F1FF',
  },
  {
    key: 'Shortlisted',
    label: 'Shortlisted',
    color: '#0EA5E9',
    soft: '#EFF8FF',
  },
  {
    key: 'Assessment',
    label: 'Assessment',
    color: '#06B6D4',
    soft: '#ECFEFF',
  },
  {
    key: 'Technical Interview',
    label: 'Technical',
    color: '#D97706',
    soft: '#FFFAEB',
  },
  {
    key: 'HR Interview',
    label: 'HR Round',
    color: '#E11D48',
    soft: '#FFF1F3',
  },
  {
    key: 'Offer',
    label: 'Offer',
    color: '#059669',
    soft: '#ECFDF3',
  },
  {
    key: 'Hired',
    label: 'Hired',
    color: '#047857',
    soft: '#ECFDF3',
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getStageBadge(stage: string): string {
  const map: Record<string, string> = {
    Applied: 'dashboard-badge dashboard-badge-indigo',
    Screening: 'dashboard-badge dashboard-badge-purple',
    Shortlisted: 'dashboard-badge dashboard-badge-blue',
    Assessment: 'dashboard-badge dashboard-badge-cyan',
    'Technical Interview':
      'dashboard-badge dashboard-badge-amber',
    'HR Interview': 'dashboard-badge dashboard-badge-rose',
    Offer: 'dashboard-badge dashboard-badge-green',
    Hired: 'dashboard-badge dashboard-badge-dark-green',
    Rejected: 'dashboard-badge dashboard-badge-red',
  };

  return (
    map[stage] ||
    'dashboard-badge dashboard-badge-indigo'
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      color: '#047857',
      background: '#ECFDF3',
      border: '#ABEFC6',
      label: 'Strong',
    };
  }

  if (score >= 70) {
    return {
      color: '#B54708',
      background: '#FFFAEB',
      border: '#FEDF89',
      label: 'Good',
    };
  }

  return {
    color: '#B42318',
    background: '#FFF1F3',
    border: '#FECDD6',
    label: 'Low',
  };
}

/* -------------------------------------------------------------------------- */
/* Small reusable components                                                   */
/* -------------------------------------------------------------------------- */

interface IconBoxProps {
  children: React.ReactNode;
  tone?: 'indigo' | 'blue' | 'green' | 'amber' | 'purple';
}

const IconBox: React.FC<IconBoxProps> = ({
  children,
  tone = 'indigo',
}) => {
  const tones = {
    indigo: {
      background: '#F1F0FF',
      color: '#635BFF',
    },
    blue: {
      background: '#EFF8FF',
      color: '#1570EF',
    },
    green: {
      background: '#ECFDF3',
      color: '#079455',
    },
    amber: {
      background: '#FFFAEB',
      color: '#D97706',
    },
    purple: {
      background: '#F5F1FF',
      color: '#7C3AED',
    },
  };

  const current = tones[tone];

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: current.background,
        color: current.color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
};

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  icon,
  title,
  subtitle,
  action,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 22,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
      }}
    >
      {icon}

      <div>
        <div
          style={{
            color: '#101828',
            fontSize: 14,
            lineHeight: 1.25,
            fontWeight: 750,
            letterSpacing: '-.015em',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#98A2B3',
            fontSize: 10.5,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>

    {action}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export const DashboardView: React.FC<
  DashboardViewProps
> = ({
  stats,
  onSelectApplication,
  onNavigateToJobs,
  onNavigateToPipeline,
  onNavigateToCandidates,
}) => {
    return (
      <>
        <style>{`
        .premium-dashboard {
          --pd-bg: #F8F9FB;
          --pd-surface: #FFFFFF;
          --pd-border: #E4E7EC;
          --pd-border-light: #EAECF0;
          --pd-text: #101828;
          --pd-secondary: #475467;
          --pd-muted: #98A2B3;
          --pd-primary: #635BFF;
          --pd-primary-soft: #F1F0FF;
        }

        .premium-dashboard * {
          box-sizing: border-box;
        }

        .premium-dashboard {
          width: 100%;
          color: var(--pd-text);
          animation: dashboardFadeIn .35s ease both;
        }

        @keyframes dashboardFadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pd-card {
          background: var(--pd-surface);
          border: 1px solid var(--pd-border);
          border-radius: 14px;
          box-shadow:
            0 1px 2px rgba(16,24,40,.02),
            0 8px 28px rgba(16,24,40,.025);
        }

        .pd-card-hover {
          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .pd-card-hover:hover {
          transform: translateY(-1px);
          border-color: #D7DAE0;
          box-shadow:
            0 3px 6px rgba(16,24,40,.025),
            0 12px 32px rgba(16,24,40,.045);
        }

        .pd-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid #D0D5DD;
          background: #FFFFFF;
          color: #344054;
          border-radius: 7px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all .16s ease;
        }

        .pd-action:hover {
          background: #F9FAFB;
          border-color: #BFC4CC;
        }

        .pd-primary-action {
          background: #635BFF;
          border-color: #635BFF;
          color: white;
          box-shadow: 0 4px 10px rgba(99,91,255,.14);
        }

        .pd-primary-action:hover {
          background: #554CE8;
          border-color: #554CE8;
        }

        .pd-link {
          border: 0;
          padding: 0;
          background: transparent;
          color: #635BFF;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .pd-link:hover {
          text-decoration: underline;
        }

        .pd-kpi-number {
          color: #101828;
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -.045em;
        }

        .pd-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pd-table th {
          height: 40px;
          padding: 0 20px;
          border-bottom: 1px solid #EAECF0;
          color: #98A2B3;
          font-size: 9px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: .06em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
          background: #FCFCFD;
        }

        .pd-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #F2F4F7;
          vertical-align: middle;
        }

        .pd-table tbody tr {
          cursor: pointer;
          transition: background .15s ease;
        }

        .pd-table tbody tr:hover {
          background: #FAFAFF;
        }

        .pd-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .dashboard-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 9.5px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .dashboard-badge-indigo {
          background: #F1F0FF;
          color: #5146C7;
          border-color: #E4E1FF;
        }

        .dashboard-badge-purple {
          background: #F5F1FF;
          color: #6D28D9;
          border-color: #E9DFFF;
        }

        .dashboard-badge-blue {
          background: #EFF8FF;
          color: #175CD3;
          border-color: #D1E9FF;
        }

        .dashboard-badge-cyan {
          background: #ECFEFF;
          color: #0E7490;
          border-color: #CFFAFE;
        }

        .dashboard-badge-amber {
          background: #FFFAEB;
          color: #B54708;
          border-color: #FEDF89;
        }

        .dashboard-badge-rose {
          background: #FFF1F3;
          color: #BE123C;
          border-color: #FECDD6;
        }

        .dashboard-badge-green {
          background: #ECFDF3;
          color: #067647;
          border-color: #ABEFC6;
        }

        .dashboard-badge-dark-green {
          background: #ECFDF3;
          color: #047857;
          border-color: #A7F3D0;
        }

        .dashboard-badge-red {
          background: #FFF1F3;
          color: #B42318;
          border-color: #FECDD6;
        }

        .pd-skill-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 27px;
          padding: 0 8px;
          border-radius: 7px;
          background: #F8F9FC;
          border: 1px solid #EAECF0;
          color: #475467;
          font-size: 9.5px;
          font-weight: 650;
        }

        .pd-score {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 27px;
          padding: 0 8px;
          border-radius: 7px;
          font-size: 9.5px;
          font-weight: 800;
        }

        .pd-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 10px;
          background:
            linear-gradient(135deg, #F1F0FF, #E9E7FF);
          border: 1px solid #E0DDFF;
          color: #5146C7;
          font-weight: 800;
        }

        .pd-empty {
          padding: 55px 20px;
          text-align: center;
        }

        @media (max-width: 1100px) {
          .pd-top-grid {
            grid-template-columns: 1fr !important;
          }

          .pd-side-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 800px) {
          .pd-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .pd-side-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 560px) {
          .pd-kpi-grid {
            grid-template-columns: 1fr !important;
          }

          .pd-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .pd-header-actions {
            width: 100%;
          }

          .pd-header-actions button {
            flex: 1;
          }

          .pd-card {
            border-radius: 11px;
          }

          .pd-table th,
          .pd-table td {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>

        <div
          className="premium-dashboard"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* ================================================================== */}
          {/* Dashboard header                                                   */}
          {/* ================================================================== */}

          <div
            className="pd-header"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#12B76A',
                    boxShadow:
                      '0 0 0 3px rgba(18,183,106,.10)',
                  }}
                />

                <span
                  style={{
                    color: '#067647',
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Recruitment overview
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  color: '#101828',
                  fontSize: 25,
                  lineHeight: 1.15,
                  fontWeight: 800,
                  letterSpacing: '-.035em',
                }}
              >
                Hiring dashboard
              </h1>

              <p
                style={{
                  margin: '7px 0 0',
                  color: '#667085',
                  fontSize: 11.5,
                  lineHeight: 1.5,
                }}
              >
                Monitor your hiring activity, candidate quality,
                and recruitment pipeline.
              </p>
            </div>

            <div
              className="pd-header-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onNavigateToCandidates}
                className="pd-action"
              >
                <Users size={13} />
                Candidates
              </button>

              <button
                type="button"
                onClick={onNavigateToJobs}
                className="pd-action pd-primary-action"
              >
                <Briefcase size={13} />
                Manage positions
              </button>
            </div>
          </div>

          {/* ================================================================== */}
          {/* KPI cards                                                           */}
          {/* ================================================================== */}

          <div
            className="pd-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4,minmax(0,1fr))',
              gap: 12,
            }}
          >
            {/* Active positions */}
            <div
              className="pd-card pd-card-hover"
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <IconBox tone="indigo">
                  <Briefcase size={17} />
                </IconBox>

                <button
                  onClick={onNavigateToJobs}
                  className="pd-link"
                >
                  View
                  <ArrowRight size={11} />
                </button>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: '#667085',
                    fontSize: 10,
                    fontWeight: 650,
                  }}
                >
                  Active positions
                </div>

                <div
                  className="pd-kpi-number"
                  style={{ marginTop: 6 }}
                >
                  {stats.active_jobs}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 10,
                    color: '#079455',
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <ArrowUpRight size={12} />
                  Hiring actively
                </div>
              </div>
            </div>

            {/* Candidates */}
            <div
              className="pd-card pd-card-hover"
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <IconBox tone="blue">
                  <Users size={17} />
                </IconBox>

                <button
                  onClick={onNavigateToCandidates}
                  className="pd-link"
                >
                  Rank
                  <ArrowRight size={11} />
                </button>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: '#667085',
                    fontSize: 10,
                    fontWeight: 650,
                  }}
                >
                  Total candidates
                </div>

                <div
                  className="pd-kpi-number"
                  style={{ marginTop: 6 }}
                >
                  {stats.total_applicants}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 10,
                    color: '#1570EF',
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <TrendingUp size={12} />
                  +3 this week
                </div>
              </div>
            </div>

            {/* AI match */}
            <div
              className="pd-card pd-card-hover"
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <IconBox tone="purple">
                  <Sparkles size={17} />
                </IconBox>

                <span
                  style={{
                    minHeight: 24,
                    padding: '0 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: 999,
                    background: '#F5F1FF',
                    border: '1px solid #E9DFFF',
                    color: '#6D28D9',
                    fontSize: 9,
                    fontWeight: 750,
                  }}
                >
                  <Zap size={10} />
                  AI
                </span>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: '#667085',
                    fontSize: 10,
                    fontWeight: 650,
                  }}
                >
                  Avg. AI match score
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 3,
                    marginTop: 6,
                  }}
                >
                  <span className="pd-kpi-number">
                    {stats.average_match_score}
                  </span>

                  <span
                    style={{
                      color: '#98A2B3',
                      fontSize: 14,
                      fontWeight: 650,
                    }}
                  >
                    %
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 10,
                    color: '#6D28D9',
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={11} />
                  High precision
                </div>
              </div>
            </div>

            {/* Hired */}
            <div
              className="pd-card pd-card-hover"
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <IconBox tone="green">
                  <UserCheck size={17} />
                </IconBox>

                <span
                  style={{
                    minHeight: 24,
                    padding: '0 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: 999,
                    background: '#ECFDF3',
                    border: '1px solid #ABEFC6',
                    color: '#067647',
                    fontSize: 9,
                    fontWeight: 750,
                  }}
                >
                  <CheckCircle2 size={10} />
                  Active
                </span>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: '#667085',
                    fontSize: 10,
                    fontWeight: 650,
                  }}
                >
                  Hired & onboarded
                </div>

                <div
                  className="pd-kpi-number"
                  style={{ marginTop: 6 }}
                >
                  {stats.hired_count}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 10,
                    color: '#079455',
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={11} />
                  Successful placements
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* Main analytics                                                      */}
          {/* ================================================================== */}

          <div
            className="pd-top-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.55fr 1fr',
              gap: 12,
            }}
          >
            {/* ================================================================ */}
            {/* Funnel                                                            */}
            {/* ================================================================ */}

            <div
              className="pd-card"
              style={{
                padding: '22px 22px 20px',
              }}
            >
              <SectionHeading
                icon={
                  <IconBox tone="indigo">
                    <Activity size={16} />
                  </IconBox>
                }
                title="Recruitment funnel"
                subtitle="Candidate distribution across every hiring stage."
                action={
                  <button
                    type="button"
                    onClick={onNavigateToPipeline}
                    className="pd-action"
                  >
                    Pipeline
                    <ChevronRight size={12} />
                  </button>
                }
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {STAGES.map((stage) => {
                  const count =
                    stats.pipeline_funnel?.[stage.key] || 0;

                  const total = stats.total_applicants || 0;

                  const pct =
                    total > 0
                      ? (count / total) * 100
                      : 0;

                  return (
                    <div key={stage.key}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: stage.color,
                              boxShadow: `0 0 0 3px ${stage.soft}`,
                            }}
                          />

                          <span
                            style={{
                              color: '#475467',
                              fontSize: 10.5,
                              fontWeight: 600,
                            }}
                          >
                            {stage.label}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                          }}
                        >
                          <span
                            style={{
                              color: '#98A2B3',
                              fontSize: 9,
                              fontWeight: 600,
                            }}
                          >
                            {pct.toFixed(0)}%
                          </span>

                          <span
                            style={{
                              minWidth: 22,
                              textAlign: 'right',
                              color: '#101828',
                              fontSize: 10.5,
                              fontWeight: 750,
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '100%',
                          height: 7,
                          borderRadius: 999,
                          background: '#F2F4F7',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(
                              count > 0 ? 2.5 : 0,
                              pct
                            )}%`,
                            height: '100%',
                            minWidth:
                              count > 0 ? 3 : 0,
                            borderRadius: 999,
                            background: stage.color,
                            transition:
                              'width .5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Funnel footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid #EAECF0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    color: '#667085',
                    fontSize: 9.5,
                  }}
                >
                  <BarChart3
                    size={13}
                    color="#635BFF"
                  />
                  {stats.total_applicants} total applicants
                </div>

                <button
                  type="button"
                  onClick={onNavigateToPipeline}
                  className="pd-link"
                >
                  Open full pipeline
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {/* ================================================================ */}
            {/* Right analytics                                                    */}
            {/* ================================================================ */}

            <div
              className="pd-side-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 12,
              }}
            >
              {/* Top skills */}
              <div
                className="pd-card"
                style={{
                  padding: '21px 21px 20px',
                }}
              >
                <SectionHeading
                  icon={
                    <IconBox tone="amber">
                      <TrendingUp size={16} />
                    </IconBox>
                  }
                  title="Skills in demand"
                  subtitle="Most frequently matched candidate skills."
                />

                {stats.top_skills_in_demand?.length >
                  0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {stats.top_skills_in_demand
                      .slice(0, 6)
                      .map((item, index) => {
                        const maxCount = Math.max(
                          ...stats.top_skills_in_demand.map(
                            (skill) => skill.count
                          ),
                          1
                        );

                        const width =
                          (item.count / maxCount) *
                          100;

                        return (
                          <div key={item.skill}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'space-between',
                                gap: 10,
                                marginBottom: 5,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems:
                                    'center',
                                  gap: 7,
                                  minWidth: 0,
                                }}
                              >
                                <span
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    display: 'grid',
                                    placeItems:
                                      'center',
                                    background:
                                      index === 0
                                        ? '#F1F0FF'
                                        : '#F8F9FB',
                                    color:
                                      index === 0
                                        ? '#635BFF'
                                        : '#98A2B3',
                                    fontSize: 8.5,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {index + 1}
                                </span>

                                <span
                                  style={{
                                    color:
                                      '#475467',
                                    fontSize: 10.5,
                                    fontWeight: 650,
                                    overflow:
                                      'hidden',
                                    textOverflow:
                                      'ellipsis',
                                    whiteSpace:
                                      'nowrap',
                                  }}
                                >
                                  {item.skill}
                                </span>
                              </div>

                              <span
                                style={{
                                  color:
                                    '#101828',
                                  fontSize: 9.5,
                                  fontWeight: 750,
                                }}
                              >
                                {item.count}
                              </span>
                            </div>

                            <div
                              style={{
                                height: 4,
                                background:
                                  '#F2F4F7',
                                borderRadius: 999,
                                overflow:
                                  'hidden',
                                marginLeft: 27,
                              }}
                            >
                              <div
                                style={{
                                  width: `${width}%`,
                                  height:
                                    '100%',
                                  borderRadius:
                                    999,
                                  background:
                                    index === 0
                                      ? '#635BFF'
                                      : '#C7C9D2',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '20px 0',
                      color: '#98A2B3',
                      fontSize: 10,
                    }}
                  >
                    No skill data available yet.
                  </div>
                )}
              </div>

              {/* Time to hire */}
              <div
                className="pd-card"
                style={{
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <IconBox tone="purple">
                      <Clock size={17} />
                    </IconBox>

                    <div>
                      <div
                        style={{
                          color: '#667085',
                          fontSize: 9.5,
                          fontWeight: 650,
                        }}
                      >
                        Average time-to-hire
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'baseline',
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            color: '#101828',
                            fontSize: 27,
                            lineHeight: 1,
                            fontWeight: 800,
                            letterSpacing:
                              '-.045em',
                          }}
                        >
                          14
                        </span>

                        <span
                          style={{
                            color: '#98A2B3',
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 7px',
                        borderRadius: 999,
                        background: '#ECFDF3',
                        color: '#067647',
                        fontSize: 8.5,
                        fontWeight: 750,
                      }}
                    >
                      <TrendingUp size={10} />
                      68% faster
                    </div>

                    <div
                      style={{
                        color: '#98A2B3',
                        fontSize: 8.5,
                        marginTop: 5,
                      }}
                    >
                      vs. benchmark
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* Recent candidates                                                   */}
          {/* ================================================================== */}

          <div
            className="pd-card"
            style={{
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                padding: '21px 22px',
                borderBottom: '1px solid #EAECF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 15,
              }}
            >
              <SectionHeading
                icon={
                  <IconBox tone="indigo">
                    <Target size={16} />
                  </IconBox>
                }
                title="Recent AI-screened candidates"
                subtitle="Review your latest candidate matches and hiring stages."
                action={null}
              />

              <button
                type="button"
                onClick={onNavigateToCandidates}
                className="pd-action"
                style={{
                  flexShrink: 0,
                  marginBottom: 22,
                }}
              >
                View all
                <ChevronRight size={12} />
              </button>
            </div>

            {/* Table */}
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            >
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>AI match</th>
                    <th>Stage</th>
                    <th>Experience</th>
                    <th>Matched skills</th>
                    <th
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {stats.recent_applications.map(
                    (app) => {
                      const score =
                        app.match_score || 0;

                      const scoreTone =
                        getScoreTone(score);

                      return (
                        <tr
                          key={app.id}
                          onClick={() =>
                            onSelectApplication(app)
                          }
                        >
                          {/* Candidate */}
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems:
                                  'center',
                                gap: 10,
                                minWidth: 190,
                              }}
                            >
                              <div
                                className="pd-avatar"
                                style={{
                                  width: 36,
                                  height: 36,
                                  fontSize: 10,
                                }}
                              >
                                {getInitials(
                                  app.candidate
                                    ?.full_name ||
                                  'NA'
                                )}
                              </div>

                              <div
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    color:
                                      '#101828',
                                    fontSize:
                                      10.5,
                                    fontWeight:
                                      750,
                                    whiteSpace:
                                      'nowrap',
                                    overflow:
                                      'hidden',
                                    textOverflow:
                                      'ellipsis',
                                    maxWidth: 170,
                                  }}
                                >
                                  {
                                    app
                                      .candidate
                                      ?.full_name
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop: 2,
                                    color:
                                      '#98A2B3',
                                    fontSize: 8.5,
                                    whiteSpace:
                                      'nowrap',
                                    overflow:
                                      'hidden',
                                    textOverflow:
                                      'ellipsis',
                                    maxWidth: 170,
                                  }}
                                >
                                  {
                                    app
                                      .candidate
                                      ?.email
                                  }
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td>
                            <span
                              style={{
                                color:
                                  '#475467',
                                fontSize: 10,
                                fontWeight:
                                  600,
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {app.job?.title ||
                                '—'}
                            </span>
                          </td>

                          {/* Score */}
                          <td>
                            <span
                              className="pd-score"
                              style={{
                                color:
                                  scoreTone.color,
                                background:
                                  scoreTone.background,
                                border: `1px solid ${scoreTone.border}`,
                              }}
                            >
                              <Sparkles size={10} />
                              {score}%
                            </span>
                          </td>

                          {/* Stage */}
                          <td>
                            <span
                              className={getStageBadge(
                                app.stage
                              )}
                            >
                              {app.stage}
                            </span>
                          </td>

                          {/* Experience */}
                          <td>
                            <span
                              style={{
                                color:
                                  '#475467',
                                fontSize: 10,
                                fontWeight: 600,
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {app.candidate
                                ?.total_experience_years ??
                                0}{' '}
                              yrs
                            </span>
                          </td>

                          {/* Skills */}
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems:
                                  'center',
                                flexWrap:
                                  'wrap',
                                gap: 4,
                                minWidth: 150,
                              }}
                            >
                              {(
                                app.matched_skills ||
                                []
                              )
                                .slice(0, 3)
                                .map((skill) => (
                                  <span
                                    key={skill}
                                    className="pd-skill-chip"
                                  >
                                    <CheckCircle2
                                      size={
                                        9
                                      }
                                      color="#079455"
                                    />
                                    {skill}
                                  </span>
                                ))}

                              {(
                                app.matched_skills ||
                                []
                              ).length > 3 && (
                                  <span
                                    style={{
                                      color:
                                        '#98A2B3',
                                      fontSize: 8.5,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    +
                                    {app
                                      .matched_skills
                                      .length -
                                      3}
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Action */}
                          <td
                            style={{
                              textAlign:
                                'right',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectApplication(
                                  app
                                );
                              }}
                              className="pd-action"
                            >
                              Profile
                              <ArrowUpRight
                                size={11}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {/* Empty state */}
              {stats.recent_applications
                .length === 0 && (
                  <div className="pd-empty">
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        margin: '0 auto 13px',
                        borderRadius: 14,
                        background: '#F1F0FF',
                        border: '1px solid #E4E1FF',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Users
                        size={21}
                        color="#635BFF"
                      />
                    </div>

                    <div
                      style={{
                        color: '#101828',
                        fontSize: 13,
                        fontWeight: 750,
                      }}
                    >
                      No candidates yet
                    </div>

                    <div
                      style={{
                        maxWidth: 340,
                        margin: '5px auto 17px',
                        color: '#98A2B3',
                        fontSize: 10,
                        lineHeight: 1.55,
                      }}
                    >
                      Share an open position to start
                      collecting applications and
                      building your candidate pipeline.
                    </div>

                    <button
                      type="button"
                      onClick={onNavigateToJobs}
                      className="pd-action pd-primary-action"
                    >
                      <Briefcase size={12} />
                      View positions
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}
            </div>

            {/* Table footer */}
            {stats.recent_applications.length >
              0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '13px 20px',
                    borderTop:
                      '1px solid #EAECF0',
                    background: '#FCFCFD',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#98A2B3',
                      fontSize: 9,
                    }}
                  >
                    <Activity size={11} />
                    Showing {stats.recent_applications.length}{' '}
                    recent applications
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToCandidates}
                    className="pd-link"
                  >
                    Open candidate directory
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
          </div>

          {/* ================================================================== */}
          {/* Bottom insight strip                                                */}
          {/* ================================================================== */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 15px',
              borderRadius: 11,
              border: '1px solid #E4E1FF',
              background:
                'linear-gradient(90deg,#F8F7FF,#FCFCFF)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: '#fff',
                border: '1px solid #E4E1FF',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles
                size={14}
                color="#635BFF"
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: '#344054',
                  fontSize: 10.5,
                  fontWeight: 750,
                }}
              >
                AI-powered hiring intelligence
              </div>

              <div
                style={{
                  color: '#98A2B3',
                  fontSize: 9,
                  lineHeight: 1.45,
                  marginTop: 2,
                }}
              >
                Candidate match scores and skill
                insights help prioritize the profiles
                most aligned with your open roles.
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToCandidates}
              className="pd-link"
            >
              Review candidates
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </>
    );
  };

export default DashboardView;

