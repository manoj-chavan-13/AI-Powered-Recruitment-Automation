import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Job } from '../types';
import { api } from '../services/api';

interface PublicCareersViewProps {
  onBackToStudio?: () => void;
}

export const PublicCareersView: React.FC<PublicCareersViewProps> = ({ onBackToStudio }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        const fetched = await api.getJobs();
        if (isMounted) setJobs(fetched.filter(j => j.status === 'active'));
      } catch (err) {
        console.error('Failed to load careers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const departments = ['All', ...Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))];

  const filteredJobs = jobs.filter(job => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.department.toLowerCase().includes(query) ||
      job.required_skills?.some(s => s.toLowerCase().includes(query));

    const matchesDept = deptFilter === 'All' || job.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleBack = () => {
    if (onBackToStudio) onBackToStudio();
    else navigate('/');
  };

  return (
    <div className="careers-page">
      <style>{`
        .careers-page {
          min-height: 100vh;
          background: #f5f6f8;
          color: #182230;
          font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        }

        .careers-shell {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .careers-nav {
          height: 72px;
          background: #fff;
          border-bottom: 1px solid #dfe3e8;
          display: flex;
          align-items: center;
        }

        .careers-nav-inner {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .brand-mark {
          width: 34px;
          height: 34px;
          background: #172033;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .brand-name {
          font-size: 17px;
          line-height: 20px;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #111827;
        }

        .brand-name span {
          color: #2563eb;
        }

        .brand-caption {
          margin-top: 2px;
          font-size: 10px;
          line-height: 14px;
          color: #7b8492;
          text-transform: uppercase;
          letter-spacing: .09em;
          font-weight: 700;
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #526071;
          font-weight: 600;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          background: #16845b;
          border-radius: 50%;
        }

        .hero {
          padding: 72px 0 48px;
          border-bottom: 1px solid #dfe3e8;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(260px, .7fr);
          gap: 70px;
          align-items: end;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          color: #2563eb;
          font-size: 10px;
          line-height: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .13em;
        }

        .eyebrow-line {
          width: 30px;
          height: 2px;
          background: #2563eb;
        }

        .hero h1 {
          margin: 0;
          max-width: 760px;
          color: #101828;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1.02;
          letter-spacing: -.052em;
          font-weight: 800;
        }

        .hero h1 em {
          color: #2563eb;
          font-style: normal;
        }

        .hero-copy {
          margin: 22px 0 0;
          max-width: 680px;
          color: #596678;
          font-size: 16px;
          line-height: 27px;
        }

        .hero-meta {
          border-left: 1px solid #cfd5dc;
          padding-left: 25px;
          padding-bottom: 3px;
        }

        .hero-meta-label {
          color: #8a94a3;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .hero-meta-value {
          margin-top: 8px;
          color: #172033;
          font-size: 25px;
          line-height: 30px;
          font-weight: 800;
          letter-spacing: -.03em;
        }

        .hero-meta-note {
          margin-top: 5px;
          color: #667085;
          font-size: 12px;
          line-height: 18px;
        }

        .toolbar {
          padding: 24px 0;
          border-bottom: 1px solid #dfe3e8;
        }

        .toolbar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-wrap {
          position: relative;
          flex: 1;
        }

        .search-wrap svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .careers-input,
        .careers-select {
          box-sizing: border-box;
          height: 44px;
          width: 100%;
          border: 1px solid #cfd5dc;
          border-radius: 3px;
          background: #fff;
          color: #172033;
          outline: none;
          font-size: 13px;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .careers-input {
          padding: 0 14px 0 39px;
        }

        .careers-select {
          min-width: 205px;
          padding: 0 35px 0 13px;
        }

        .careers-input:focus,
        .careers-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
        }

        .results-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 20px;
          padding: 35px 0 16px;
        }

        .results-title {
          margin: 0;
          font-size: 14px;
          line-height: 20px;
          font-weight: 800;
          color: #172033;
          letter-spacing: -.01em;
        }

        .results-title span {
          color: #2563eb;
        }

        .results-note {
          color: #8993a1;
          font-size: 11px;
        }

        .jobs {
          border-top: 1px solid #cfd5dc;
          background: #fff;
        }

        .job-row {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(180px, .75fr) 155px;
          gap: 28px;
          align-items: center;
          padding: 25px 22px;
          border-bottom: 1px solid #e3e6ea;
          cursor: pointer;
          transition: background .15s ease, padding-left .15s ease;
        }

        .job-row:hover {
          background: #fafbfc;
          padding-left: 26px;
        }

        .job-kicker {
          margin-bottom: 7px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #2563eb;
          font-size: 9px;
          line-height: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .11em;
        }

        .job-kicker-dot {
          width: 5px;
          height: 5px;
          background: #16845b;
          border-radius: 50%;
        }

        .job-title {
          margin: 0;
          color: #111827;
          font-size: 18px;
          line-height: 24px;
          font-weight: 800;
          letter-spacing: -.025em;
        }

        .job-description {
          margin: 8px 0 0;
          max-width: 650px;
          color: #687386;
          font-size: 12px;
          line-height: 19px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-facts {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .job-fact {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #596678;
          font-size: 11px;
          line-height: 16px;
        }

        .job-fact svg {
          color: #7c8796;
          flex-shrink: 0;
        }

        .skills {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .skill {
          padding: 3px 7px;
          border: 1px solid #dce1e6;
          background: #f8f9fa;
          color: #667085;
          font-size: 9px;
          line-height: 13px;
          font-weight: 700;
        }

        .job-action {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .apply-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #172033;
          font-size: 11px;
          line-height: 16px;
          font-weight: 800;
          text-decoration: none;
          border-bottom: 1px solid #172033;
          padding-bottom: 4px;
        }

        .apply-link svg {
          transition: transform .15s ease;
        }

        .job-row:hover .apply-link svg {
          transform: translateX(3px);
        }

        .empty-state {
          padding: 72px 25px;
          background: #fff;
          text-align: center;
          border-bottom: 1px solid #e3e6ea;
        }

        .empty-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d8dde3;
          color: #7b8492;
        }

        .empty-state h3 {
          margin: 0 0 6px;
          font-size: 15px;
          color: #172033;
        }

        .empty-state p {
          margin: 0;
          color: #7b8492;
          font-size: 12px;
        }

        .loading {
          padding: 70px 0;
          text-align: center;
          color: #7b8492;
          font-size: 12px;
        }

        .careers-footer {
          padding: 48px 0 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #8a94a3;
          font-size: 10px;
          line-height: 16px;
        }

        .footer-brand {
          color: #596678;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .careers-shell,
          .careers-nav-inner {
            width: min(100% - 28px, 1120px);
          }

          .hero {
            padding: 48px 0 38px;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .hero-meta {
            border-left: 0;
            border-top: 1px solid #cfd5dc;
            padding: 20px 0 0;
          }

          .toolbar-row {
            flex-direction: column;
            align-items: stretch;
          }

          .careers-select {
            min-width: 0;
          }

          .results-head {
            display: block;
          }

          .results-note {
            display: block;
            margin-top: 5px;
          }

          .job-row {
            grid-template-columns: 1fr;
            gap: 17px;
            padding: 22px 16px;
          }

          .job-row:hover {
            padding-left: 18px;
          }

          .job-action {
            justify-content: flex-start;
          }

          .careers-footer {
            display: block;
          }
        }
      `}</style>

      <header className="careers-nav">
        <div className="careers-nav-inner">
          <div className="brand">
            <div className="brand-mark">TI</div>
            <div>
              <div className="brand-name">Talent<span>IQ</span></div>
              <div className="brand-caption">Careers</div>
            </div>
          </div>

          <div className="nav-status">
            <span className="status-dot" />
            Open positions
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="careers-shell hero-grid">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                TalentIQ Careers
              </div>

              <h1>
                Build what comes <em>next.</em>
              </h1>

              <p className="hero-copy">
                Explore current opportunities across engineering and platform teams.
                Find a role where your experience can create meaningful, measurable impact.
              </p>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-label">Current opportunities</div>
              <div className="hero-meta-value">{jobs.length} open roles</div>
              <div className="hero-meta-note">
                Updated directly from the TalentIQ hiring platform.
              </div>
            </div>
          </div>
        </section>

        <section className="toolbar">
          <div className="careers-shell">
            <div className="toolbar-row">
              <div className="search-wrap">
                <Search size={16} color="#8a94a3" />
                <input
                  type="text"
                  placeholder="Search roles, departments or skills"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="careers-input"
                  aria-label="Search open positions"
                />
              </div>

              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="careers-select"
                  aria-label="Filter by department"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'All' ? 'All departments' : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="careers-shell">
          <div className="results-head">
            <h2 className="results-title">
              Open positions <span>({filteredJobs.length})</span>
            </h2>
            <div className="results-note">
              Select a role to view the full position and application form.
            </div>
          </div>

          {loading ? (
            <div className="jobs">
              <div className="loading">Loading available positions...</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="jobs">
              <div className="empty-state">
                <div className="empty-icon">
                  <Briefcase size={20} />
                </div>
                <h3>No matching positions</h3>
                <p>Try a different keyword or department.</p>
              </div>
            </div>
          ) : (
            <div className="jobs">
              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  className="job-row"
                  onClick={() => navigate(`/careers/${job.public_token}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/careers/${job.public_token}`);
                    }
                  }}
                >
                  <div>
                    <div className="job-kicker">
                      <span>{job.department || 'Opportunity'}</span>
                      <span className="job-kicker-dot" />
                      <span>Open</span>
                    </div>

                    <h3 className="job-title">{job.title}</h3>

                    <p className="job-description">{job.description}</p>

                    {(job.required_skills || []).length > 0 && (
                      <div className="skills">
                        {(job.required_skills || []).slice(0, 5).map((skill) => (
                          <span className="skill" key={skill}>
                            {skill}
                          </span>
                        ))}
                        {(job.required_skills || []).length > 5 && (
                          <span className="skill">
                            +{job.required_skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="job-facts">
                    <div className="job-fact">
                      <MapPin size={14} />
                      <span>{job.location} · {job.work_mode}</span>
                    </div>
                    <div className="job-fact">
                      <Clock size={14} />
                      <span>{job.min_experience}–{job.max_experience || 8} years experience</span>
                    </div>
                    <div className="job-fact">
                      <Briefcase size={14} />
                      <span>{job.employment_type}</span>
                    </div>
                  </div>

                  <div className="job-action">
                    <a
                      href={`/careers/${job.public_token}`}
                      className="apply-link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/careers/${job.public_token}`);
                      }}
                    >
                      View position
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          <footer className="careers-footer">
            <div>
              <span className="footer-brand">TalentIQ</span>
              <span> · Careers</span>
            </div>
            <div>
              © {new Date().getFullYear()} TalentIQ Inc. · Equal Opportunity Employer
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default PublicCareersView;
