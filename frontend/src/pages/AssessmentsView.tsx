import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Eye,
  Save,
  Wand2,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Check,
  ExternalLink,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  CheckCircle,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Job, Application, Assessment, AssessmentQuestion } from '../types';
import { api } from '../services/api';

interface AssessmentsViewProps {
  jobs: Job[];
  applications: Application[];
  selectedJobId?: string;
  onSelectJob?: (jobId: string) => void;
  onRefreshData?: () => void;
  assessments?: Assessment[];
  onSubmitAssessment?: (appId: string, answers: Record<string, number>) => Promise<any>;
}

interface EditableQuestion {
  id: string;
  question: string;
  category?: string;
  options: string[];
  correct_idx: number;
  points: number;
  explanation?: string;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  jobs,
  applications,
  selectedJobId,
  onSelectJob,
  onRefreshData,
}) => {
  // Active Job selection
  const [activeJobId, setActiveJobId] = useState<string>(
    selectedJobId || (jobs.length > 0 ? jobs[0].id : '')
  );

  // Sync if parent prop changes
  useEffect(() => {
    if (selectedJobId && selectedJobId !== activeJobId) {
      setActiveJobId(selectedJobId);
    }
  }, [selectedJobId]);

  const currentJob = useMemo(() => {
    return jobs.find((j) => j.id === activeJobId) || jobs[0] || null;
  }, [jobs, activeJobId]);

  // View tabs: 'builder' | 'analytics'
  const [activeTab, setActiveTab] = useState<'builder' | 'analytics'>('builder');

  // Assessment state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Editable Form fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(25);
  const [passingScore, setPassingScore] = useState<number>(70);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);

  // Expanded question card IDs
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  // Question search filter
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<EditableQuestion[]>([]);
  const [aiSelectedIndices, setAiSelectedIndices] = useState<Record<number, boolean>>({});

  // Candidate Test Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewQuestionIdx, setPreviewQuestionIdx] = useState<number>(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, number>>({});

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load assessment for the active job
  const fetchAssessmentForJob = async (jobId: string) => {
    if (!jobId) return;
    setLoadingAssessment(true);
    try {
      const asmts = await api.getJobAssessments(jobId);
      const activeAsmt = asmts.find((a) => a.is_active) || asmts[0] || null;
      if (activeAsmt) {
        setAssessment(activeAsmt);
        setTitle(activeAsmt.title || '');
        setDescription(activeAsmt.description || '');
        setTimeLimitMinutes(activeAsmt.time_limit_minutes || 25);
        setPassingScore(activeAsmt.passing_score || 70);
        setIsActive(activeAsmt.is_active ?? true);

        const loadedQuestions: EditableQuestion[] = (activeAsmt.questions || []).map(
          (q: any, i: number) => ({
            id: q.id || `q_${Date.now()}_${i}`,
            question: q.question || '',
            category: q.category || 'Core Competency',
            options:
              q.options && q.options.length > 0
                ? [...q.options]
                : ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_idx: typeof q.correct_idx === 'number' ? q.correct_idx : 0,
            points: q.points || 20,
            explanation: q.explanation || '',
          })
        );
        setQuestions(loadedQuestions);

        const initExpanded: Record<string, boolean> = {};
        loadedQuestions.slice(0, 3).forEach((q) => {
          initExpanded[q.id] = true;
        });
        setExpandedQuestionIds(initExpanded);
      } else {
        setAssessment(null);
        setTitle(`${currentJob?.title || 'Job'} Technical Assessment`);
        setDescription(
          `Official technical assessment evaluating core competencies and domain fundamentals for ${currentJob?.title || 'this position'}.`
        );
        setTimeLimitMinutes(25);
        setPassingScore(70);
        setIsActive(true);
        setQuestions([
          {
            id: `q_${Date.now()}_1`,
            question: `What is the primary architectural best practice when developing applications for ${currentJob?.title || 'this role'}?`,
            category: 'Architecture',
            options: [
              'Decoupled modular components with clear interface boundaries',
              'Monolithic tightly coupled modules',
              'Direct database access from user interface',
              'Skipping automated unit testing for speed',
            ],
            correct_idx: 0,
            points: 20,
            explanation: 'Modular decoupled architectures maximize maintainability and scalability.',
          },
        ]);
        setExpandedQuestionIds({ [`q_${Date.now()}_1`]: true });
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error fetching job assessment:', err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Load stats for current job
  const fetchStatsForJob = async (jobId: string) => {
    if (!jobId) return;
    setLoadingStats(true);
    try {
      const res = await api.getAssessmentStats(jobId);
      setStats(res);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeJobId) {
      fetchAssessmentForJob(activeJobId);
      fetchStatsForJob(activeJobId);
    }
  }, [activeJobId]);

  const handleSelectJob = (jobId: string) => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          'You have unsaved changes in the current assessment. Do you want to discard them and switch jobs?'
        )
      ) {
        return;
      }
    }
    setActiveJobId(jobId);
    if (onSelectJob) onSelectJob(jobId);
  };

  const notifyChange = () => {
    setHasUnsavedChanges(true);
  };

  const handleAddQuestion = () => {
    const newQ: EditableQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      category: 'Technical Knowledge',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_idx: 0,
      points: 20,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
    setExpandedQuestionIds((prev) => ({ ...prev, [newQ.id]: true }));
    notifyChange();
  };

  const handleUpdateQuestion = (id: string, updates: Partial<EditableQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    notifyChange();
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('An assessment must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    notifyChange();
  };

  const handleDuplicateQuestion = (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const duplicated: EditableQuestion = {
      ...target,
      id: `q_${Date.now()}`,
      question: `${target.question} (Copy)`,
    };
    const targetIdx = questions.findIndex((q) => q.id === id);
    const updated = [...questions];
    updated.splice(targetIdx + 1, 0, duplicated);
    setQuestions(updated);
    setExpandedQuestionIds((prev) => ({ ...prev, [duplicated.id]: true }));
    notifyChange();
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setQuestions(updated);
    notifyChange();
  };

  const handleOptionChange = (qId: string, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const updatedOpts = [...q.options];
        updatedOpts[optIdx] = val;
        return { ...q, options: updatedOpts };
      })
    );
    notifyChange();
  };

  const handleAddOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return { ...q, options: [...q.options, `New Option ${q.options.length + 1}`] };
      })
    );
    notifyChange();
  };

  const handleRemoveOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) {
          alert('Each question must have at least two options.');
          return q;
        }
        const updatedOpts = q.options.filter((_, i) => i !== optIdx);
        let newCorrect = q.correct_idx;
        if (newCorrect >= updatedOpts.length) newCorrect = updatedOpts.length - 1;
        return { ...q, options: updatedOpts, correct_idx: newCorrect };
      })
    );
    notifyChange();
  };

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    questions.forEach((q) => {
      all[q.id] = true;
    });
    setExpandedQuestionIds(all);
  };

  const handleCollapseAll = () => {
    setExpandedQuestionIds({});
  };

  const handleSaveAssessment = async () => {
    if (!currentJob) return;
    if (!title.trim()) {
      alert('Please provide an assessment title.');
      return;
    }
    if (questions.some((q) => !q.question.trim())) {
      alert('All questions must have question text filled out.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Assessment> = {
        job_id: currentJob.id,
        title: title.trim(),
        description: description.trim(),
        time_limit_minutes: timeLimitMinutes,
        passing_score: passingScore,
        questions: questions.map((q, idx) => ({
          id: q.id || `q_${idx + 1}`,
          question: q.question,
          category: q.category || 'Core Skill',
          options: q.options,
          correct_idx: q.correct_idx,
          points: q.points || 20,
          explanation: q.explanation || '',
        })) as any,
        is_active: isActive,
      };

      if (assessment && assessment.id) {
        const res = await api.updateAssessment(assessment.id, payload);
        setAssessment(res);
      } else {
        const res = await api.createAssessment(payload);
        setAssessment(res);
      }

      setHasUnsavedChanges(false);
      showToast('Assessment saved and published successfully!');
      if (onRefreshData) onRefreshData();
      fetchStatsForJob(currentJob.id);
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      alert(err.message || 'Failed to save assessment changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAiGenerator = () => {
    setIsAiModalOpen(true);
    setAiGeneratedQuestions([]);
    setAiSelectedIndices({});
  };

  const handleTriggerAiGeneration = async () => {
    if (!currentJob) return;
    setAiGenerating(true);
    try {
      const generated = await api.generateQuestions(
        currentJob.title,
        currentJob.required_skills || [],
        aiCount
      );
      if (generated && generated.length > 0) {
        setAiGeneratedQuestions(generated);
        const selectedMap: Record<number, boolean> = {};
        generated.forEach((_, idx) => {
          selectedMap[idx] = true;
        });
        setAiSelectedIndices(selectedMap);
      } else {
        alert('Could not generate questions. Please try again.');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      alert('Error generating questions: ' + (err.message || 'Unknown error'));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleInsertAiQuestions = () => {
    const toInsert = aiGeneratedQuestions.filter((_, idx) => aiSelectedIndices[idx]);
    if (toInsert.length === 0) {
      alert('Please select at least one question to insert.');
      return;
    }
    const updated = [...questions, ...toInsert];
    setQuestions(updated);
    toInsert.forEach((q) => {
      setExpandedQuestionIds((prev) => ({ ...prev, [q.id]: true }));
    });
    setIsAiModalOpen(false);
    notifyChange();
    showToast(`Added ${toInsert.length} AI-generated questions to the assessment!`);
  };

  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return questions;
    const term = questionSearch.toLowerCase();
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(term) ||
        (q.category && q.category.toLowerCase().includes(term)) ||
        q.options.some((opt) => opt.toLowerCase().includes(term))
    );
  }, [questions, questionSearch]);

  const totalPoints = useMemo(() => {
    return questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
  }, [questions]);

  const jobApplications = useMemo(() => {
    return applications.filter((a) => a.job_id === activeJobId);
  }, [applications, activeJobId]);

  return (
    <div className="w-full flex flex-col gap-6 pb-16 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              TALENTIQ ASSESSMENT STUDIO
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Technical Skill Assessments
            </h1>
            <p className="text-xs md:text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
              Design, test, and automate objective technical assessments for every open role. When candidates reach the Assessment stage, TalentIQ automatically emails secure test links, grades submissions, and schedules Google Meet rounds for qualified talent.
            </p>
          </div>

          {/* Key Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 text-center">
              <div className="text-xl font-black text-white">{questions.length}</div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">Questions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 text-center">
              <div className="text-xl font-black text-white">{timeLimitMinutes}m</div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">Time Limit</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 text-center">
              <div className="text-xl font-black text-emerald-300">{passingScore}%</div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">Pass Cutoff</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 text-center">
              <div className="text-xl font-black text-white">{stats?.pass_rate ?? 0}%</div>
              <div className="text-[11px] text-indigo-200 font-medium mt-0.5">Pass Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Job Roles Switcher Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Select Job Role to Configure Assessment:</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {jobs.length} Active Positions
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 custom-scroll">
          {jobs.map((job) => {
            const isSelected = job.id === activeJobId;
            return (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer min-w-[220px] ${isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                >
                  {job.title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'
                      }`}
                  >
                    {job.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {job.department} • {job.status === 'active' ? 'Active' : 'Closed'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Subheader Tabs & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/80 border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('builder')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'builder'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Assessment Builder ({questions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Candidate Analytics & Activity</span>
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
          )}

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview Test</span>
          </button>

          <button
            onClick={handleOpenAiGenerator}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={handleSaveAssessment}
            disabled={saving || loadingAssessment}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: ASSESSMENT BUILDER ── */}
      {activeTab === 'builder' && (
        <div className="flex flex-col gap-6">
          {/* Core Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Assessment Configuration & Rules
                  </h2>
                  <p className="text-xs text-slate-400">
                    Role: <strong className="text-slate-700">{currentJob?.title}</strong>
                  </p>
                </div>
              </div>

              {/* Status Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsActive(!isActive);
                  notifyChange();
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                />
                {isActive ? 'Active (Auto-Sent to Candidates)' : 'Draft (Paused)'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    notifyChange();
                  }}
                  placeholder="e.g. Senior Frontend Engineer Technical Assessment"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Time Limit Quick Selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Time Limit</span>
                  <span className="text-indigo-600 font-bold">{timeLimitMinutes} minutes</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[15, 20, 25, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setTimeLimitMinutes(m);
                        notifyChange();
                      }}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${timeLimitMinutes === m
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Passing Threshold Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Passing Score Cutoff</span>
                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded-md ${passingScore >= 70
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {passingScore}%
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={passingScore}
                    onChange={(e) => {
                      setPassingScore(Number(e.target.value));
                      notifyChange();
                    }}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 min-w-8 text-right">
                    {passingScore}%
                  </span>
                </div>
              </div>

              {/* Overview & Candidate Guidelines */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Candidate Overview & Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    notifyChange();
                  }}
                  placeholder="Explain candidate instructions, evaluation objectives, and rules..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Zero-Touch Automation Notice */}
            <div className="mt-5 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 leading-relaxed">
                <strong className="font-bold text-indigo-900">Zero-Touch Autonomous Transition:</strong> When candidates score <strong>≥ {passingScore}%</strong> on this test, TalentIQ automatically schedules a Technical Interview, generates a Google Meet link, and emails them their interview details.
              </div>
            </div>
          </div>

          {/* ── Questions List Section ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  Assessment Questions
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {questions.length} Questions • {totalPoints} Total Points
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click the green radio button next to an option to designate the correct answer.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search questions */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter questions..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Questions Container */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const isExpanded = !!expandedQuestionIds[q.id];

                return (
                  <div
                    key={q.id}
                    className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 transition-all hover:border-slate-300"
                  >
                    {/* Question Header Bar */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div
                            onClick={() => toggleExpand(q.id)}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                          >
                            {q.question || '(Untitled Question - Click to edit)'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Category: {q.category || 'Core Skill'} • {q.points || 20} Points • {q.options.length} Options
                          </div>
                        </div>
                      </div>

                      {/* Card Header Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(q.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                          title="Duplicate question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="p-1 rounded-md text-slate-500 hover:bg-slate-200"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Question Expanded Body */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                        {/* Question Text & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Question Text
                            </label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { question: e.target.value })
                              }
                              placeholder="Enter technical question prompt..."
                              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Points
                            </label>
                            <input
                              type="number"
                              value={q.points}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { points: Number(e.target.value) })
                              }
                              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>

                        {/* Options List */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold text-slate-700">
                              Options & Correct Answer
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(q.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                              const isCorrect = q.correct_idx === oi;

                              return (
                                <div
                                  key={oi}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300'
                                    : 'bg-white border-slate-200'
                                    }`}
                                >
                                  {/* Radio select correct */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuestion(q.id, { correct_idx: oi })
                                    }
                                    title="Mark as correct answer"
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-300 text-transparent hover:border-emerald-500'
                                      }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>

                                  <span
                                    className={`text-xs font-bold min-w-4 ${isCorrect ? 'text-emerald-800' : 'text-slate-400'
                                      }`}
                                  >
                                    {String.fromCharCode(65 + oi)}.
                                  </span>

                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) =>
                                      handleOptionChange(q.id, oi, e.target.value)
                                    }
                                    placeholder={`Option ${String.fromCharCode(65 + oi)} text...`}
                                    className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-hidden"
                                  />

                                  {isCorrect && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                                      Correct
                                    </span>
                                  )}

                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(q.id, oi)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                      title="Remove option"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rationale / Explanation */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Recruiter Explanation / Rationale
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { explanation: e.target.value })
                            }
                            placeholder="Why is this answer correct? (e.g. In React 19, hooks can be used directly...)"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Quick Add Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question Manually
                </button>

                <button
                  type="button"
                  onClick={handleOpenAiGenerator}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate with Gemini AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CANDIDATE ACTIVITY & ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6">
          {/* Stats KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Invited Candidates
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {stats?.total_invited ?? jobApplications.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Candidates in Assessment pipeline</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Completed Tests
              </div>
              <div className="text-2xl font-black text-indigo-600 mt-2">
                {stats?.completed_count ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Total submitted submissions</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Average Score
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {stats?.average_score ?? 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Mean candidate performance</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Passing Rate
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {stats?.pass_rate ?? 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Threshold: {passingScore}% or higher
              </div>
            </div>
          </div>

          {/* Candidates Pipeline Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Assessment Stage Candidates ({jobApplications.length})
              </h3>
              <span className="text-xs text-slate-400">
                Live candidate submissions for {currentJob?.title}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Candidate Name</th>
                    <th className="py-3 px-4 font-bold">Current Stage</th>
                    <th className="py-3 px-4 font-bold">AI Match</th>
                    <th className="py-3 px-4 font-bold">Test Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No candidates currently registered for this job role.
                      </td>
                    </tr>
                  ) : (
                    jobApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {app.candidate?.full_name || 'Anonymous'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {app.candidate?.email || 'No email provided'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {app.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700">{app.match_score}%</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {app.stage === 'Assessment' ? 'Awaiting Completion' : 'Advanced'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`/assessment/${app.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            <span>Open Candidate Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AI QUESTION GENERATOR MODAL ── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Question Generator (Gemini)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate role-specific assessment questions based on required job skills.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800">
                  Target Role: {currentJob?.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Skills Evaluated: {(currentJob?.required_skills || []).join(', ') || 'General engineering'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Number of Questions to Generate
                </label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              {aiGeneratedQuestions.length === 0 ? (
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleTriggerAiGeneration}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Generating with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Assessment Questions Now</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Generated Questions ({aiGeneratedQuestions.length})</span>
                    <span className="text-indigo-600">Select questions to insert:</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {aiGeneratedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setAiSelectedIndices((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${aiSelectedIndices[idx]
                          ? 'bg-indigo-50/70 border-indigo-300'
                          : 'bg-white border-slate-200 opacity-60'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={!!aiSelectedIndices[idx]}
                            onChange={() => { }}
                            className="mt-0.5 rounded-sm accent-indigo-600"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{q.question}</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {q.options.length} options • Answer: Option{' '}
                              {String.fromCharCode(65 + q.correct_idx)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAiGeneratedQuestions([])}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertAiQuestions}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Insert Selected Questions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CANDIDATE TEST PREVIEW MODAL ── */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  Candidate Preview Mode
                </div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No questions available to preview.
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-2">
                    <span>
                      Question {previewQuestionIdx + 1} of {questions.length}
                    </span>
                    <span>{questions[previewQuestionIdx].points || 20} Points</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-4">
                    {questions[previewQuestionIdx].question}
                  </h4>

                  <div className="space-y-2.5">
                    {questions[previewQuestionIdx].options.map((opt, optIdx) => {
                      const isSelected =
                        previewAnswers[questions[previewQuestionIdx].id] === optIdx;

                      return (
                        <div
                          key={optIdx}
                          onClick={() =>
                            setPreviewAnswers((prev) => ({
                              ...prev,
                              [questions[previewQuestionIdx].id]: optIdx,
                            }))
                          }
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 font-semibold text-indigo-950'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={previewQuestionIdx === 0}
                onClick={() => setPreviewQuestionIdx(previewQuestionIdx - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>

              <div className="text-xs text-slate-400 font-medium">
                {previewQuestionIdx + 1} / {questions.length}
              </div>

              {previewQuestionIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setPreviewQuestionIdx(previewQuestionIdx + 1)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Close Preview
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentsView;
