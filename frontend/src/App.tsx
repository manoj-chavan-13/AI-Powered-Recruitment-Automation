import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './pages/DashboardView';
import { JobsView } from './pages/JobsView';
import { PipelineView } from './pages/PipelineView';
import { CandidatesView } from './pages/CandidatesView';
import { AssessmentsView } from './pages/AssessmentsView';
import { InterviewsView } from './pages/InterviewsView';
import { EmailsView } from './pages/EmailsView';
import { PublicApplyView } from './pages/PublicApplyView';
import { PublicCareersView } from './pages/PublicCareersView';
import { CandidateAssessmentPortal } from './pages/CandidateAssessmentPortal';

// Modals
import { JobCreateModal } from './components/modals/JobCreateModal';
import { CandidateDetailModal } from './components/modals/CandidateDetailModal';
import { ShareJobModal } from './components/modals/ShareJobModal';
import { InterviewScheduleModal } from './components/modals/InterviewScheduleModal';

import { api } from './services/api';
import { Job, Application, DashboardStats, Assessment, Interview, EmailLog } from './types';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scheduleApp, setScheduleApp] = useState<Application | null>(null);

  // Active public token for candidate portal
  const [publicApplyToken, setPublicApplyToken] = useState<string>('');

  // Load Initial Data
  const loadData = async () => {
    try {
      const [fetchedJobs, fetchedStats, fetchedApps, fetchedInterviews, fetchedEmails] = await Promise.all([
        api.getJobs(),
        api.getDashboardStats(),
        api.getApplications(selectedJobId),
        api.getInterviews(),
        api.getEmailLogs(),
      ]);
      setJobs(fetchedJobs);
      setStats(fetchedStats);
      setApplications(fetchedApps);
      setInterviews(fetchedInterviews);
      setEmailLogs(fetchedEmails);

      const targetJobId = selectedJobId || (fetchedJobs.length > 0 ? fetchedJobs[0].id : '');
      if (targetJobId) {
        const asmts = await api.getJobAssessments(targetJobId);
        setAssessments(asmts);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobId]);

  // Actions
  const handleCreateJob = async (jobData: Partial<Job>) => {
    const created = await api.createJob(jobData);
    setJobs([created, ...jobs]);
    await loadData();
  };

  const handleToggleJobStatus = async (jobId: string) => {
    await api.toggleJobStatus(jobId);
    setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: j.status === 'active' ? 'closed' : 'active' } : j)));
  };

  const handleUpdateStage = async (appId: string, stage: string, notes?: string) => {
    await api.updateStage(appId, stage, notes);
    setApplications(applications.map((a) => (a.id === appId ? { ...a, stage: stage as any, notes: notes || a.notes } : a)));
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, stage: stage as any, notes: notes || selectedApp.notes });
    }
    // Refresh stats & logs
    const updatedStats = await api.getDashboardStats();
    const updatedLogs = await api.getEmailLogs();
    setStats(updatedStats);
    setEmailLogs(updatedLogs);
  };

  const handleScheduleInterview = async (data: any) => {
    const created = await api.scheduleInterview(data);
    setInterviews([created, ...interviews]);
    // Refresh apps as stage may advance to Technical/HR Interview
    const updatedApps = await api.getApplications(selectedJobId);
    setApplications(updatedApps);
    const updatedLogs = await api.getEmailLogs();
    setEmailLogs(updatedLogs);
  };

  const handleRecordFeedback = async (interviewId: string, rating: number, feedback: string, result: string) => {
    await api.recordInterviewFeedback(interviewId, rating, feedback, result);
    setInterviews(
      interviews.map((i) => (i.id === interviewId ? { ...i, rating, feedback, result: result as any, status: 'completed' } : i))
    );
    const updatedApps = await api.getApplications(selectedJobId);
    setApplications(updatedApps);
    const updatedLogs = await api.getEmailLogs();
    setEmailLogs(updatedLogs);
  };

  const handleSubmitAssessment = async (appId: string, answers: Record<string, number>) => {
    const res = await api.submitAssessment(appId, answers);
    const updatedApps = await api.getApplications(selectedJobId);
    setApplications(updatedApps);
    return res;
  };

  const handleOpenPublicApply = (token?: string) => {
    if (token) {
      setPublicApplyToken(token);
      navigate(`/careers/${token}`);
    } else {
      navigate('/careers');
    }
  };

  // Derive current studio tab from path
  const getTabFromPath = (pathname: string): string => {
    if (pathname.startsWith('/jobs')) return 'jobs';
    if (pathname.startsWith('/pipeline')) return 'pipeline';
    if (pathname.startsWith('/candidates')) return 'candidates';
    if (pathname.startsWith('/assessments')) return 'assessments';
    if (pathname.startsWith('/interviews')) return 'interviews';
    if (pathname.startsWith('/emails')) return 'emails';
    return 'dashboard';
  };

  const currentTab = getTabFromPath(location.pathname);
  // Only match candidate routes: /apply, /apply/:token, and /assessment/:applicationId
  // IMPORTANT: Do NOT match /assessments (plural) which is the Recruiter Studio Assessments Tab!
  const isCandidatePortalRoute =
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/apply') ||   // legacy redirect support
    location.pathname.startsWith('/assessment/') ||
    location.pathname === '/assessment';

  // Dedicated Candidate Career & Assessment Portal Routes
  if (isCandidatePortalRoute) {
    return (
      <Routes>
        <Route
          path="/careers"
          element={
            <PublicCareersView
              onBackToStudio={() => navigate('/')}
            />
          }
        />
        <Route
          path="/careers/:token"
          element={
            <PublicApplyView
              onBackToStudio={() => navigate('/')}
              onSubmitSuccess={() => loadData()}
            />
          }
        />
        {/* Legacy /apply aliases */}
        <Route path="/apply" element={<Navigate to="/careers" replace />} />
        <Route path="/apply/:token" element={<PublicApplyView onBackToStudio={() => navigate('/')} onSubmitSuccess={() => loadData()} />} />
        <Route
          path="/assessment/:applicationId"
          element={<CandidateAssessmentPortal />}
        />
        <Route path="*" element={<Navigate to="/careers" replace />} />
      </Routes>
    );
  }

  // Recruiter Studio Workspace with Sidebar & Header
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        openPublicPortal={() => handleOpenPublicApply()}
      />

      {/* Main Workspace */}
      <div className="main-workspace">
        <Header
          currentTab={currentTab}
          jobs={jobs}
          selectedJobId={selectedJobId}
          setSelectedJobId={setSelectedJobId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openCreateJobModal={() => setIsCreateJobOpen(true)}
          openShareModal={() => setIsShareModalOpen(true)}
        />

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                stats ? (
                  <DashboardView
                    stats={stats}
                    onSelectApplication={(app) => setSelectedApp(app)}
                    onNavigateToJobs={() => navigate('/jobs')}
                    onNavigateToPipeline={() => navigate('/pipeline')}
                    onNavigateToCandidates={() => navigate('/candidates')}
                  />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading analytics...</div>
                )
              }
            />

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route
              path="/jobs"
              element={
                <JobsView
                  jobs={jobs}
                  onOpenCreateJob={() => setIsCreateJobOpen(true)}
                  onOpenShareModal={(job) => {
                    if (job) setPublicApplyToken(job.public_token);
                    setIsShareModalOpen(true);
                  }}
                  onOpenPublicApply={(token) => handleOpenPublicApply(token)}
                  onToggleStatus={handleToggleJobStatus}
                />
              }
            />

            <Route
              path="/pipeline"
              element={
                <PipelineView
                  applications={applications}
                  onSelectApplication={(app) => setSelectedApp(app)}
                  onUpdateStage={handleUpdateStage}
                />
              }
            />

            <Route
              path="/candidates"
              element={
                <CandidatesView
                  applications={applications}
                  jobs={jobs}
                  onSelectApplication={(app) => setSelectedApp(app)}
                />
              }
            />

            <Route
              path="/assessments"
              element={
                <AssessmentsView
                  jobs={jobs}
                  applications={applications}
                  selectedJobId={selectedJobId}
                  onSelectJob={setSelectedJobId}
                  onRefreshData={loadData}
                />
              }
            />

            <Route
              path="/interviews"
              element={
                <InterviewsView
                  interviews={interviews}
                  applications={applications}
                  onOpenScheduleModal={(app) => {
                    setScheduleApp(app || applications[0] || null);
                    setIsScheduleModalOpen(true);
                  }}
                  onRecordFeedback={handleRecordFeedback}
                />
              }
            />

            <Route
              path="/emails"
              element={
                <EmailsView
                  emailLogs={emailLogs}
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <JobCreateModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onCreate={handleCreateJob}
      />

      <CandidateDetailModal
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onUpdateStage={handleUpdateStage}
        onOpenScheduleInterview={(app) => {
          setScheduleApp(app);
          setIsScheduleModalOpen(true);
        }}
      />

      <ShareJobModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        jobs={jobs}
        onOpenPublicApply={(token) => handleOpenPublicApply(token)}
      />

      <InterviewScheduleModal
        application={scheduleApp}
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleApp(null);
        }}
        onSchedule={handleScheduleInterview}
      />
    </div>
  );
};

export default App;
