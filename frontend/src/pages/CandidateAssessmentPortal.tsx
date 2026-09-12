import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Video,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  Award,
  X,
  Calendar,
  User,
  ExternalLink,
  RotateCcw,
  Briefcase,
  AlertCircle,
  FileCheck2,
  Lock,
  Maximize2,
  Eye,
  Camera,
  ShieldAlert,
  VideoOff,
  Cpu,
  Ban,
  ShieldX,
  Smartphone,
  EyeOff,
  Check,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import {
  getProctoringModel,
  analyzeVideoFrame,
  drawProctoringOverlay,
  resetGazeBaseline,
  ProctoringFrameResult,
} from '../services/proctoringModel';

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
}

interface AssessmentData {
  already_completed: boolean;
  application_id?: string;
  candidate_name: string;
  job_title: string;
  assessment_id?: string;
  title: string;
  description?: string;
  time_limit_minutes: number;
  passing_score: number;
  passing_threshold?: number;
  total_questions?: number;
  questions?: Question[];
  score?: number;
  passed?: boolean;
  interview?: {
    meeting_link?: string;
    scheduled_at?: string;
    interviewer_name?: string;
  };
}

export const CandidateAssessmentPortal: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentData | null>(null);

  // Assessment flow states
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Direct Auto-Submit & Cheating Disqualification States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAutoTerminated, setIsAutoTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);

  // Real Webcam & Computer Vision Model States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isCameraWidgetCollapsed, setIsCameraWidgetCollapsed] = useState(false);
  const [aiModel, setAiModel] = useState<any>(null);
  const [proctorResult, setProctorResult] = useState<ProctoringFrameResult | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitTriggeredRef = useRef(false);

  // Consecutive frame and strike counters for pattern-based proctoring
  const noFaceCountRef = useRef(0);
  const multipleFacesCountRef = useRef(0);
  const suspiciousStrikesRef = useRef(0);
  const inActiveDeviationRef = useRef(false);
  const continuousAwayFramesRef = useRef(0);
  const [strikeCount, setStrikeCount] = useState(0);

  // Trigger floating security toast
  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Preload BlazeFace Computer Vision Model
  useEffect(() => {
    let isMounted = true;
    getProctoringModel().then((m) => {
      if (isMounted && m) {
        setAiModel(m);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Assessment Data
  useEffect(() => {
    if (!applicationId) {
      setError('No application identifier found in link.');
      setLoading(false);
      return;
    }

    const loadAssessment = async () => {
      try {
        setLoading(true);
        const res = await api.getCandidateAssessment(applicationId);
        setData(res);
        if (res.time_limit_minutes) {
          setTimeLeft(res.time_limit_minutes * 60);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load candidate assessment session.');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [applicationId]);

  // Request Camera Access
  const requestCameraAccess = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        setCameraStream(stream);
        setCameraPermission('granted');
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play().catch(() => { });
        }
      } else {
        setCameraPermission('denied');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraPermission('denied');
    }
  };

  // Attach camera stream to video elements
  useEffect(() => {
    if (cameraStream) {
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = cameraStream;
        previewVideoRef.current.play().catch(() => { });
      }
      if (activeVideoRef.current) {
        activeVideoRef.current.srcObject = cameraStream;
        activeVideoRef.current.play().catch(() => { });
      }
    }
  }, [cameraStream, hasStarted, isCameraWidgetCollapsed]);

  // Clean up camera tracks on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Fullscreen Helpers
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen entry error or not permitted:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     DIRECT AUTO-SUBMIT HANDLER (ZERO TIMERS, IMMEDIATE DISQUALIFICATION)
     ────────────────────────────────────────────────────────────────────────── */
  const handleAutoSubmitCheating = async (reason: string) => {
    if (autoSubmitTriggeredRef.current || !applicationId) return;
    autoSubmitTriggeredRef.current = true;
    setSubmitting(true);
    setIsAutoTerminated(true);
    setTerminationReason(reason);
    setShowConfirmModal(false);

    try {
      const res = await api.submitAssessment(applicationId, answers, {
        is_disqualified: true,
        termination_reason: reason,
        proctoring_violations: 1,
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        submitted: true,
        disqualified: true,
        termination_reason: reason,
        message: `Assessment terminated: ${reason}`,
      });
    } finally {
      setSubmitting(false);
      await exitFullscreen();
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  // Start Assessment Flow
  const handleStartExam = async () => {
    resetGazeBaseline();
    suspiciousStrikesRef.current = 0;
    continuousAwayFramesRef.current = 0;
    inActiveDeviationRef.current = false;
    setStrikeCount(0);
    if (!cameraStream && cameraPermission !== 'denied') {
      await requestCameraAccess();
    }
    await enterFullscreen();
    setHasStarted(true);
  };

  // 1. Anti-Cheat: Real-Time Computer Vision Analysis (Direct Auto-Submit)
  useEffect(() => {
    if (!cameraStream || !aiModel) return;

    const interval = setInterval(async () => {
      if (autoSubmitTriggeredRef.current) return;

      const video = hasStarted ? activeVideoRef.current : previewVideoRef.current;
      const canvas = hasStarted ? activeCanvasRef.current : previewCanvasRef.current;

      if (!video || video.readyState < 2) return;

      const res = await analyzeVideoFrame(aiModel, video);
      setProctorResult(res);

      if (canvas) {
        drawProctoringOverlay(canvas, res, video.videoWidth || 320, video.videoHeight || 240);
      }

      // Pre-assessment check mode: no auto-submit
      if (!hasStarted) return;

      // ── CRITICAL VIOLATION 1: Candidate Absent (No Face Detected) ──
      if (res.status === 'NO_FACE') {
        noFaceCountRef.current += 1;
        if (noFaceCountRef.current >= 3) {
          handleAutoSubmitCheating('Candidate Absent: No face detected in webcam frame. Continuous face visibility is mandatory.');
          return;
        }
      } else {
        noFaceCountRef.current = 0;
      }

      // ── CRITICAL VIOLATION 2: Multiple People in Room ──
      if (res.status === 'MULTIPLE_FACES') {
        multipleFacesCountRef.current += 1;
        if (multipleFacesCountRef.current >= 2) {
          handleAutoSubmitCheating(`Unauthorized Assistance: Multiple individuals (${res.faceCount} faces) detected in the webcam view.`);
          return;
        }
      } else {
        multipleFacesCountRef.current = 0;
      }

      // ── PATTERN REPETITION & PROLONGED GAZE TRACKING ──
      // Evaluates gaze deviations (looking down at mobile, side glances, looking on top, eyes closed).
      // Momentary natural eye movements (1-2s) are tolerated with a warning strike.
      // Repeated infractions (3 strikes) or prolonged staring (>3.5s) automatically submits the exam!
      const isGazeDeviated =
        res.status === 'LOOKING_DOWN' ||
        res.status === 'EYES_LOOKING_DOWN' ||
        res.status === 'LOOKING_AWAY' ||
        res.status === 'EYES_LOOKING_AWAY' ||
        res.status === 'LOOKING_UP' ||
        res.status === 'EYES_CLOSED';

      if (isGazeDeviated) {
        continuousAwayFramesRef.current += 1;

        // Condition A: Prolonged Staring (Candidate stares away/down for >3.5 seconds continuously)
        if (continuousAwayFramesRef.current >= 7) {
          const detailedMsg =
            res.status === 'LOOKING_DOWN' || res.status === 'EYES_LOOKING_DOWN'
              ? 'Prolonged Focus Loss: Candidate continuously stared down at mobile phone / lap for over 3.5 seconds.'
              : res.status === 'LOOKING_UP'
                ? 'Prolonged Focus Loss: Candidate continuously looked up away from the screen for over 3.5 seconds.'
                : 'Prolonged Focus Loss: Candidate continuously looked away off-screen for over 3.5 seconds.';
          handleAutoSubmitCheating(detailedMsg);
          return;
        }

        // Condition B: Repeated Suspicious Pattern (Strike Increment on confirmed excursion)
        if (!inActiveDeviationRef.current && continuousAwayFramesRef.current >= 2) {
          inActiveDeviationRef.current = true;
          suspiciousStrikesRef.current += 1;
          const currentStrike = suspiciousStrikesRef.current;
          setStrikeCount(currentStrike);

          if (currentStrike >= 3) {
            handleAutoSubmitCheating(
              'Repeated Suspicious Gaze Pattern: Candidate repeatedly looked away from the assessment screen (3 policy violations recorded).'
            );
            return;
          } else {
            const warningType =
              res.status === 'LOOKING_DOWN' || res.status === 'EYES_LOOKING_DOWN'
                ? 'Looking down at phone/lap'
                : res.status === 'LOOKING_UP'
                  ? 'Looking on top at ceiling'
                  : 'Side glance off-screen';
            triggerToast(
              `⚠️ Proctor Warning (${currentStrike}/3): ${warningType} detected. Repeated pattern will auto-submit the exam!`
            );
          }
        }
      } else {
        // Candidate returned gaze to screen
        continuousAwayFramesRef.current = 0;
        inActiveDeviationRef.current = false;
      }
    }, 550);

    return () => clearInterval(interval);
  }, [cameraStream, aiModel, hasStarted]);

  // 2. Anti-Cheat: Disable Right-Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerToast('Right-click is disabled to preserve assessment integrity.');
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // 3. Anti-Cheat: Prevent Copy, Cut, Paste & Shortcuts
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerToast('Copying text is prohibited during this proctored evaluation.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerToast('Cutting text is prohibited during this assessment.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerToast('Pasting text is prohibited.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (
        (isMod && ['c', 'v', 'x', 'a', 'u', 'p', 's'].includes(key)) ||
        e.key === 'F12' ||
        (isMod && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        triggerToast(`Shortcut "${e.key.toUpperCase()}" is blocked by anti-cheat policy.`);
      }
    };

    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 4. Anti-Cheat: Fullscreen Exit -> Direct Auto-Submit Immediately
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (!isFs && hasStarted && !result && !data?.already_completed && !autoSubmitTriggeredRef.current) {
        handleAutoSubmitCheating('Security Breach: Candidate exited mandatory fullscreen lockdown');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasStarted, result, data?.already_completed]);

  // 5. Anti-Cheat: Tab Switch or Window Blur -> Direct Auto-Submit Immediately
  useEffect(() => {
    if (!hasStarted || result || data?.already_completed || autoSubmitTriggeredRef.current) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleAutoSubmitCheating('Unpermitted Window Switch: Candidate navigated away from active assessment window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasStarted, result, data?.already_completed]);

  // Reset Demo Session
  const handleResetAndRetake = async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      await api.resetCandidateAssessment(applicationId);
      const res = await api.getCandidateAssessment(applicationId);
      setData(res);
      setResult(null);
      setAnswers({});
      setHasStarted(false);
      setCurrentIdx(0);
      setIsAutoTerminated(false);
      setTerminationReason(null);
      resetGazeBaseline();
      autoSubmitTriggeredRef.current = false;
      noFaceCountRef.current = 0;
      multipleFacesCountRef.current = 0;
      suspiciousStrikesRef.current = 0;
      continuousAwayFramesRef.current = 0;
      inActiveDeviationRef.current = false;
      setStrikeCount(0);
      if (res.time_limit_minutes) {
        setTimeLeft(res.time_limit_minutes * 60);
      }
    } catch (err: any) {
      alert(`Error resetting test: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!hasStarted || result || data?.already_completed || autoSubmitTriggeredRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, result, data?.already_completed]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleFinalSubmit = async () => {
    if (!applicationId || submitting || autoSubmitTriggeredRef.current) return;
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const res = await api.submitAssessment(applicationId, answers, {
        is_disqualified: false,
        proctoring_violations: 0,
      });
      setResult(res);
      await exitFullscreen();
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     PREMIUM PORTAL PRESENTATION
     - Full-page product shell, not a stack of floating cards.
     - Restrained enterprise visual system.
     - TailwindCSS only for styling.
     - Assessment logic/proctoring/API behavior above remains unchanged.
     ────────────────────────────────────────────────────────────────────────── */

  const Brand = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
      <div className="h-9 w-9 shrink-0 bg-slate-950 text-white flex items-center justify-center font-black tracking-tight">
        T
      </div>
      <div className="leading-none">
        <div className="text-[13px] font-black tracking-[-0.02em] text-slate-950">TalentIQ</div>
        {!compact && <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Candidate Portal</div>}
      </div>
    </div>
  );

  const PortalFooter = () => (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>TalentIQ Candidate Assessment</span>
        <span className="flex items-center gap-2">
          <Lock className="h-3 w-3" />
          Secure assessment environment
        </span>
      </div>
    </footer>
  );

  const StatusDot = ({ tone = 'green' }: { tone?: 'green' | 'amber' | 'red' }) => (
    <span className={`h-2 w-2 shrink-0 ${tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
  );

  /* Loading */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
            <Brand />
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-5">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-6 h-10 w-10 border-2 border-slate-200 border-t-slate-900 animate-spin" />
            <p className="text-sm font-bold text-slate-900">Preparing your assessment</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Secure session and assessment data are being initialized.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* Error */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
            <Brand />
          </div>
        </header>
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center px-5 py-12">
          <div className="w-full border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-7 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">Session error</p>
                  <h1 className="mt-1 text-lg font-black tracking-tight text-slate-950">Assessment unavailable</h1>
                </div>
              </div>
            </div>
            <div className="px-7 py-6">
              <p className="text-sm leading-6 text-slate-600">
                {error || 'Unable to locate an active assessment session for this link.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/careers')}
                className="mt-6 inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Return to Careers
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* Already completed */
  if (data.already_completed) {
    const isPass = data.passed;
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Brand />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified record
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
          <div className="border-b border-slate-300 pb-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Assessment record</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">Assessment completed</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Your assessment has been recorded in the hiring system.
            </p>
          </div>

          <div className="grid border-x border-b border-slate-200 bg-white md:grid-cols-[1fr_260px]">
            <section className="p-7 sm:p-9">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {isPass ? <Award className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isPass ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                    {isPass ? 'Assessment cleared' : 'Evaluation recorded'}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{data.candidate_name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{data.job_title} · {data.title}</p>
                </div>
              </div>

              {isPass && data.interview && (
                <div className="mt-9 border-t border-slate-200 pt-7">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                    <Video className="h-4 w-4 text-indigo-600" />
                    Next step
                  </div>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">Technical interview</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Your assessment was successful and the next interview stage has been scheduled.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {data.interview.scheduled_at && (
                      <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Scheduled</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">{new Date(data.interview.scheduled_at).toLocaleString()}</p>
                      </div>
                    )}
                    {data.interview.interviewer_name && (
                      <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Interviewer</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">{data.interview.interviewer_name}</p>
                      </div>
                    )}
                  </div>

                  {data.interview.meeting_link && (
                    <a
                      href={data.interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      Join interview
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </section>

            <aside className="border-t border-slate-200 bg-slate-50 p-7 md:border-l md:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Result</p>
              <div className="mt-5">
                <span className={`text-5xl font-black tracking-[-0.05em] ${isPass ? 'text-emerald-600' : 'text-slate-950'}`}>
                  {data.score}%
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  Pass benchmark: <strong className="text-slate-800">{data.passing_threshold || 70}%</strong>
                </p>
              </div>
              <div className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Lock className="h-3.5 w-3.5" />
                  Official assessment record
                </div>
                <p className="mt-2">Your submitted result is associated with this application.</p>
              </div>
            </aside>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleResetAndRetake}
              className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake assessment
            </button>
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="text-xs font-bold text-slate-500 transition hover:text-slate-950"
            >
              Back to careers
            </button>
          </div>
        </main>
        <PortalFooter />
      </div>
    );
  }

  /* Auto termination */
  if (result?.disqualified || isAutoTerminated) {
    const activeReason = result?.termination_reason || terminationReason || 'Security policy violation detected';

    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Brand />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-600">
              <ShieldAlert className="h-4 w-4" />
              Session terminated
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <div className="border-l-4 border-rose-500 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-9">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-rose-50 text-rose-600">
                <ShieldX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">Security event</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">Assessment terminated</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The assessment session was automatically submitted after a proctoring policy violation.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Recorded reason</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-950">{activeReason}</p>
            </div>

            <div className="mt-7 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
              <div className="bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Candidate</p>
                <p className="mt-2 text-xs font-bold text-slate-800">{data.candidate_name}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Role</p>
                <p className="mt-2 text-xs font-bold text-slate-800">{data.job_title}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Status</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-rose-600"><StatusDot tone="red" /> Disqualified</p>
              </div>
            </div>

            <p className="mt-7 text-xs leading-5 text-slate-500">
              Answers recorded before termination and the associated proctoring event are retained with the application record.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/careers')}
                className="inline-flex items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Return to Careers
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetAndRetake}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset demo session
              </button>
            </div>
          </div>
        </main>
        <PortalFooter />
      </div>
    );
  }

  /* Standard submission */
  if (result) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Brand />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Submitted
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-7 py-7 sm:px-9">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Submission confirmed</p>
                  <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">Assessment submitted</h1>
                  <p className="mt-2 text-sm text-slate-500">{data.candidate_name} · {data.job_title}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-[1fr_220px]">
              <div className="px-7 py-7 sm:px-9">
                <p className="text-sm font-bold text-slate-950">Your responses have been recorded.</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {result.message || 'Your answers have been recorded and queued for evaluation. You will receive the official result and next steps by email.'}
                </p>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-7 py-7 md:border-l md:border-t-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Proctoring</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <StatusDot tone="green" />
                  Session completed
                </p>
                <p className="mt-3 text-[11px] leading-5 text-slate-500">Security audit attached to the assessment session.</p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-7 py-5 sm:px-9">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/careers')}
                  className="inline-flex items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Return to Careers
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetAndRetake}
                  className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset demo session
                </button>
              </div>
            </div>
          </div>
        </main>
        <PortalFooter />
      </div>
    );
  }

  /* Pre-assessment portal */
  if (!hasStarted) {
    const questionCount = data.total_questions || data.questions?.length || 5;

    return (
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Brand />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Secure evaluation
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-9 sm:py-12">
          <div className="grid lg:grid-cols-[1fr_310px]">
            {/* Primary information area */}
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-7 sm:px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Technical evaluation</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{data.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  {data.description || 'Complete the assessment independently within the allocated time.'}
                </p>
              </div>

              <div className="grid border-b border-slate-200 sm:grid-cols-3">
                <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0 sm:border-r">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Duration
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-950">{data.time_limit_minutes} min</p>
                </div>
                <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0 sm:border-r">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    <Award className="h-3.5 w-3.5" />
                    Benchmark
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-950">{data.passing_score}%</p>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Questions
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-950">{questionCount}</p>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8">
                <div className="flex items-start gap-3 border-l-2 border-indigo-500 bg-slate-50 px-4 py-4">
                  <div className="mt-0.5 text-indigo-600"><ShieldCheck className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-black text-slate-950">Proctored assessment</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Webcam access and fullscreen mode are required. The assessment uses real-time proctoring checks during the session.
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Candidate</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{data.candidate_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Target role</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{data.job_title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Security / camera rail */}
            <aside className="border-b border-x border-slate-200 bg-white lg:border-b lg:border-l-0">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Readiness</p>
                    <h2 className="mt-1 text-sm font-black text-slate-950">Camera & environment</h2>
                  </div>
                  <StatusDot tone={cameraStream ? 'green' : 'amber'} />
                </div>
              </div>

              <div className="p-5">
                <div className="border border-slate-200 bg-slate-950">
                  <div className="relative aspect-video overflow-hidden">
                    {cameraStream ? (
                      <>
                        <video ref={previewVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                        <canvas ref={previewCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
                        <div className="absolute left-3 top-3 flex items-center gap-2 bg-slate-950/80 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-400">
                          <StatusDot tone="green" />
                          Live check
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full min-h-[170px] flex-col items-center justify-center px-5 text-center text-slate-400">
                        <VideoOff className="h-6 w-6" />
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em]">Camera not connected</p>
                      </div>
                    )}
                  </div>
                </div>

                {cameraStream ? (
                  <div className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <p className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      Camera ready
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-emerald-700/80">
                      {proctorResult?.statusMessage || 'Vision tracking is initializing.'}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={requestCameraAccess}
                    className="mt-3 flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    <Camera className="h-4 w-4" />
                    Test camera
                  </button>
                )}

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Before you begin</p>
                  <ul className="mt-3 space-y-3">
                    {[
                      ['Fullscreen', 'Keep the assessment window active.'],
                      ['Camera', 'Keep your face clearly visible.'],
                      ['Focus', 'Remain focused on the assessment.'],
                      ['Clipboard', 'Copy, paste and shortcuts are restricted.'],
                    ].map(([title, copy]) => (
                      <li key={title} className="flex gap-3">
                        <div className="mt-0.5 text-slate-400"><CheckCircle2 className="h-3.5 w-3.5" /></div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800">{title}</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{copy}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleStartExam}
                  className="mt-7 flex w-full items-center justify-center gap-2 bg-slate-950 px-5 py-3.5 text-xs font-black text-white transition hover:bg-slate-800"
                >
                  Begin assessment
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-center text-[9px] leading-4 text-slate-400">
                  Starting will enter fullscreen mode and begin the timer.
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-5 flex items-center gap-2 text-[10px] text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            Secure candidate session · {data.application_id || applicationId}
          </div>
        </main>

        <PortalFooter />
      </div>
    );
  }

  /* Active assessment — application workspace, deliberately not card-on-card. */
  const questions = data.questions || [];
  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 180;
  const isWarning = timeLeft < 300 && !isUrgent;
  const progressPct = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-900 select-none">
      {/* Security notification */}
      {toastMessage && (
        <div className="fixed left-1/2 top-5 z-[70] -translate-x-1/2">
          <div className="flex items-center gap-2 border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Application chrome */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-5 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Brand compact />
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-bold text-slate-950">{data.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">{data.job_title}</p>
            </div>
          </div>

          <div className={`flex shrink-0 items-center gap-2 border px-3.5 py-2 ${isUrgent
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : isWarning
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-slate-300 bg-white text-slate-900'
            }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-black tracking-tight">{formatTimer(timeLeft)}</span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.12em] opacity-60 sm:inline">remaining</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 md:flex">
              <StatusDot tone={proctorResult?.status === 'VERIFIED' ? 'green' : 'amber'} />
              Proctoring active
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_280px]">
        {/* Left navigation rail */}
        <aside className="hidden min-h-[calc(100vh-70px)] border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-[70px]">
            <div className="border-b border-slate-200 px-5 py-5">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Assessment</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{answeredCount} of {totalQ} answered</p>
              <div className="mt-3 h-1 bg-slate-100">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="px-3 py-4">
              <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Questions</p>
              <div className="space-y-0.5">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${isCurrent
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center text-[10px] font-black ${isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isAnswered
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                        {isAnswered && !isCurrent ? <Check className="h-3 w-3" /> : idx + 1}
                      </span>
                      <span className="text-[11px] font-bold">
                        Question {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                <Lock className="h-3 w-3" />
                Secure mode
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-400">
                Fullscreen and proctoring checks are active for this session.
              </p>
            </div>
          </div>
        </aside>

        {/* Main question workspace */}
        <main className="min-w-0">
          <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-9">
            {/* Mobile progress / question navigation */}
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 lg:hidden">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Question</p>
                <p className="mt-1 text-sm font-black text-slate-950">{currentIdx + 1} / {totalQ}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Progress</p>
                <p className="mt-1 text-sm font-black text-slate-950">{Math.round(progressPct)}%</p>
              </div>
            </div>

            {currentQ && (
              <section className="bg-white">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">
                        Question {currentIdx + 1}
                      </span>
                      <span className="h-1 w-1 bg-slate-300" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Single choice
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {currentQ.points || 20} points
                    </span>
                  </div>
                  <h1 className="mt-5 max-w-2xl text-xl font-black leading-8 tracking-[-0.02em] text-slate-950 sm:text-2xl">
                    {currentQ.question}
                  </h1>
                </div>

                <div className="px-6 py-6 sm:px-8 sm:py-7">
                  <div className="space-y-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = answers[currentQ.id] === optIdx;
                      const letter = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || String(optIdx + 1);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                          className={`group flex w-full items-start gap-4 border px-4 py-4 text-left transition sm:px-5 ${isSelected
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                            }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-black ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {letter}
                          </span>
                          <span className={`flex-1 pt-1 text-sm leading-6 ${isSelected ? 'font-bold text-indigo-950' : 'font-medium text-slate-700'
                            }`}>
                            {opt}
                          </span>
                          {isSelected && (
                            <span className="mt-1 text-indigo-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5 sm:px-8">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(currentIdx - 1)}
                    className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="hidden text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 sm:block">
                    {answeredCount} / {totalQ} answered
                  </span>

                  {currentIdx < totalQ - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(currentIdx + 1)}
                      className="inline-flex items-center gap-2 bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="inline-flex items-center gap-2 bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      Review & submit
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Right proctor rail */}
        <aside className="border-l border-slate-200 bg-white">
          <div className="sticky top-[70px]">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Integrity monitor</p>
                  <h2 className="mt-1 text-xs font-black text-slate-950">Live proctoring</h2>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                  <StatusDot tone={proctorResult?.status === 'VERIFIED' ? 'green' : 'amber'} />
                  Live
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className={`border ${proctorResult?.status === 'VERIFIED' ? 'border-slate-200' : 'border-rose-300'
                } bg-slate-950`}>
                <div className="relative aspect-video overflow-hidden">
                  {cameraStream ? (
                    <>
                      <video ref={activeVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                      <canvas ref={activeCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
                      <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 bg-slate-950/85 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-400">
                        <StatusDot tone="green" />
                        Live
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      <VideoOff className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 border-b border-slate-200 pb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Detection status</p>
                <p className={`mt-1 text-xs font-bold ${proctorResult?.status === 'VERIFIED' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  {proctorResult?.statusMessage || 'Tracking face and eye gaze…'}
                </p>
              </div>

              <div className="border-b border-slate-200 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Eye position</span>
                  <span className={`text-[9px] font-black uppercase ${proctorResult?.eyeGaze?.gazeStatus === 'CENTERED' ? 'text-cyan-700' : 'text-slate-500'
                    }`}>
                    {proctorResult?.eyeGaze?.gazeStatus || 'Checking'}
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-200 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Pattern strikes</span>
                  <span className={`text-xs font-black ${strikeCount ? 'text-rose-600' : 'text-slate-700'}`}>{strikeCount}/3</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1.5 flex-1 ${strikeCount >= s ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              <div className="py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Session controls</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Fullscreen</span>
                    <span className={`font-bold ${isFullscreen ? 'text-emerald-600' : 'text-rose-600'}`}>{isFullscreen ? 'Locked' : 'Exit'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Camera</span>
                    <span className={`font-bold ${cameraStream ? 'text-emerald-600' : 'text-rose-600'}`}>{cameraStream ? 'Connected' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Clipboard</span>
                    <span className="font-bold text-emerald-600">Restricted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Submission modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-600">Final review</p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Submit assessment?</h2>
                <p className="mt-1 text-xs text-slate-500">This will finalize your current response set.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-slate-400 transition hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200">
              <div className="border-r border-slate-200 px-4 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Answered</p>
                <p className="mt-1 text-sm font-black text-slate-950">{answeredCount}/{totalQ}</p>
              </div>
              <div className="border-r border-slate-200 px-4 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Time</p>
                <p className="mt-1 font-mono text-sm font-black text-slate-950">{formatTimer(timeLeft)}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Status</p>
                <p className="mt-1 text-sm font-black text-emerald-600">Ready</p>
              </div>
            </div>

            {answeredCount < totalQ && (
              <div className="mx-6 mt-5 flex gap-2 border-l-2 border-amber-500 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {totalQ - answeredCount} question{totalQ - answeredCount === 1 ? '' : 's'} remain unanswered.
              </div>
            )}

            <p className="px-6 py-5 text-xs leading-5 text-slate-500">
              Once submitted, the assessment session is finalized and your responses will be sent for evaluation.
            </p>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Keep reviewing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Submitting…' : 'Confirm submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAssessmentPortal;

