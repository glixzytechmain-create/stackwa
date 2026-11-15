import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Code2, 
  Layers, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  Bot, 
  Send, 
  Eye,
  Check,
  Layout,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BarChart3,
  Terminal,
  Zap,
  Wrench,
  RotateCcw,
  Sliders,
  ChevronRight,
  RefreshCw,
  Award,
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  DsaProblem, 
  InterviewClarifyingQuestion, 
  UserInterviewProfile, 
  DayPlan, 
  TestSessionRecord,
  QuestionMode,
  SavedVisualExplanation
} from '../types';
import { InterviewTrack, GoalSectionTab } from './InterviewCard';
import { DSA_PROBLEMS } from '../data/dsaProblems';
import { UI_CHALLENGES } from '../data/uiFlows';
import { executeCodeStrict, ExecutionOutcome } from '../services/codeExecutionService';
import { 
  askAiCoach, 
  generateScenarioDsaProblem, 
  generateStepByStepFix, 
  getAiSuggestedSessionBlueprint, 
  StepByStepFix, 
  SessionBlueprint,
  generateAdaptiveMcqs,
  McqQuestion
} from '../services/aiService';
import { generateInteractiveGraphic, getCachedVisualGraphic, setCachedVisualGraphic } from '../services/generativeUiService';
import { MonacoTypingEffectOverlay } from './MonacoTypingEffectOverlay';
import { LiveUiPreviewModal } from './LiveUiPreviewModal';
import { RaiseHandModal } from './RaiseHandModal';
import { RoadmapView } from './RoadmapView';
import { AiMockRoom } from './AiMockRoom';
import { ProgressDashboard } from './ProgressDashboard';
import { VoiceDebateRoom } from './VoiceDebateRoom';
import { generateHighEffortRoadmap } from '../services/roadmapService';
import confetti from 'canvas-confetti';

interface InterviewEnvironmentProps {
  track: InterviewTrack;
  onExit: () => void;
  customProblems?: DsaProblem[];
  initialTab?: GoalSectionTab;
  profile?: UserInterviewProfile | null;
  roadmap?: DayPlan[];
  onToggleDay?: (dayNumber: number) => void;
  onOpenSettings?: () => void;
  onSaveTestRecord?: (record: TestSessionRecord) => void;
  onSaveExplanation?: (explanation: SavedVisualExplanation) => void;
  solvedCount?: number;
  completedFlowsCount?: number;
  streakDays?: number;
}

export const InterviewEnvironment: React.FC<InterviewEnvironmentProps> = ({
  track,
  onExit,
  customProblems = [],
  initialTab = 'rehearsal',
  profile = null,
  roadmap = [],
  onToggleDay,
  onOpenSettings,
  onSaveTestRecord,
  onSaveExplanation,
  solvedCount = 0,
  completedFlowsCount = 0,
  streakDays = 1
}) => {
  const problems = [...customProblems, ...DSA_PROBLEMS];
  // Session Launcher & Batch Management State (Round 1: Code Sandbox)
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [activeSessionMode, setActiveSessionMode] = useState<'ai-suggested' | 'drills' | 'long' | 'custom'>('ai-suggested');
  const [batchQuestions, setBatchQuestions] = useState<DsaProblem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState<number>(1);
  const [isLaunchingSession, setIsLaunchingSession] = useState<boolean>(false);
  const [solvedQuestionIds, setSolvedQuestionIds] = useState<Set<string>>(new Set());
  const [questionCodeMap, setQuestionCodeMap] = useState<Record<string, { javascript: string; python: string }>>({});

  // Session Exit Warning Modal
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Submit Test Modal & Persistence
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<TestSessionRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Monaco Editor & Typing Animation Refs
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [hasTypedYet, setHasTypedYet] = useState<boolean>(false);

  // Generative UI State (Replaces Scrimba & Mobbin)
  const [generativeHtml, setGenerativeHtml] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<boolean>(false);
  const [showGenerativeVisual, setShowGenerativeVisual] = useState<boolean>(false);
  const [isVisualFullScreen, setIsVisualFullScreen] = useState<boolean>(false);

  // Custom Curated Config
  const [customConfig, setCustomConfig] = useState({
    smallCount: 2,
    bigCount: 1,
    durationMinutes: 35,
    topic: 'Hash Table & Lookup',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard'
  });

  // AI Step-by-Step Fixer State
  const [aiFixData, setAiFixData] = useState<StepByStepFix | null>(null);
  const [isAiFixLoading, setIsAiFixLoading] = useState<boolean>(false);
  const [showAiFixPanel, setShowAiFixPanel] = useState<boolean>(false);

  // Compute AI suggested recipe based on profile weaknesses & session count
  const suggestedBlueprint: SessionBlueprint = getAiSuggestedSessionBlueprint(
    profile,
    Math.max(1, Math.floor((solvedCount || 0) / 2) + 1)
  );

  const [selectedProblem, setSelectedProblem] = useState<DsaProblem>(problems[0]);
  const [questionMode, setQuestionMode] = useState<QuestionMode>('code');
  const [workspaceTab, setWorkspaceTab] = useState<GoalSectionTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setWorkspaceTab(initialTab);
    }
  }, [initialTab]);
  
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState<string>(
    typeof selectedProblem.starterCode === 'string'
      ? selectedProblem.starterCode
      : (selectedProblem.starterCode.javascript || '')
  );
  const [testRun, setTestRun] = useState<{ isRunning: boolean; hasRun: boolean; outcome: ExecutionOutcome | null }>({
    isRunning: false,
    hasRun: false,
    outcome: null
  });

  // Timer Countdown (15m, 30m, 45m)
  const totalSeconds = track.intensity === '15m' ? 900 : track.intensity === '30m' ? 1800 : 2700;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isTimerRunning] = useState(true);

  // Persistent Storage Key for active rehearsal session
  const activeSessionKey = `stackwa_active_rehearsal_${track.company.toLowerCase()}`;

  // Restore active rehearsal session from localStorage on mount (e.g. after browser refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(activeSessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.isSessionActive && Array.isArray(parsed.batchQuestions) && parsed.batchQuestions.length > 0) {
          setBatchQuestions(parsed.batchQuestions);
          setActiveSessionMode(parsed.activeSessionMode || 'ai-suggested');
          setBatchNumber(parsed.batchNumber || 1);
          const qIdx = typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : 0;
          setCurrentQuestionIndex(qIdx);
          if (Array.isArray(parsed.solvedQuestionIds)) {
            setSolvedQuestionIds(new Set(parsed.solvedQuestionIds));
          }
          if (parsed.questionCodeMap) {
            setQuestionCodeMap(parsed.questionCodeMap);
          }
          if (parsed.secondsLeft && parsed.secondsLeft > 0) {
            setSecondsLeft(parsed.secondsLeft);
          }
          if (parsed.language) {
            setLanguage(parsed.language);
          }
          const activeProblem = parsed.batchQuestions[qIdx] || parsed.batchQuestions[0];
          if (activeProblem) {
            setSelectedProblem(activeProblem);
            const savedCode = parsed.code ?? parsed.questionCodeMap?.[activeProblem.id]?.[parsed.language || 'javascript'] ?? '';
            setCode(savedCode);
            setHasTypedYet(savedCode.trim().length > 0);

            // Restore cached visual graphic if present
            const cachedVisual = getCachedVisualGraphic(activeProblem.id);
            if (cachedVisual) {
              setGenerativeHtml(cachedVisual);
              if (parsed.showGenerativeVisual) {
                setShowGenerativeVisual(true);
              }
            }
          }
          setIsSessionActive(true);
        }
      }
    } catch (e) {
      console.warn("Failed to restore session from localStorage:", e);
    }
  }, [activeSessionKey]);

  // Persist session state whenever code, questions, or progress changes
  useEffect(() => {
    if (isSessionActive && batchQuestions.length > 0) {
      const dataToSave = {
        isSessionActive: true,
        activeSessionMode,
        batchNumber,
        batchQuestions,
        currentQuestionIndex,
        solvedQuestionIds: Array.from(solvedQuestionIds),
        questionCodeMap: {
          ...questionCodeMap,
          [selectedProblem.id]: {
            ...(questionCodeMap[selectedProblem.id] || { javascript: '', python: '' }),
            [language]: code
          }
        },
        code,
        language,
        secondsLeft,
        showGenerativeVisual,
        selectedProblemId: selectedProblem.id
      };
      try {
        localStorage.setItem(activeSessionKey, JSON.stringify(dataToSave));
      } catch {}
    }
  }, [
    isSessionActive,
    activeSessionMode,
    batchNumber,
    batchQuestions,
    currentQuestionIndex,
    solvedQuestionIds,
    questionCodeMap,
    code,
    language,
    secondsLeft,
    showGenerativeVisual,
    selectedProblem.id,
    activeSessionKey
  ]);

  // Language switch handler
  const handleSwitchLanguage = (newLang: 'javascript' | 'python') => {
    setLanguage(newLang);
    const starter = typeof selectedProblem.starterCode === 'string'
      ? selectedProblem.starterCode
      : (selectedProblem.starterCode[newLang] || selectedProblem.starterCode.javascript || '');
    setCode(starter);
  };

  // Launch Session across modes (AI Suggested, Quick Drills, Long Problems, Custom Curated)
  const startSession = async (
    mode: 'ai-suggested' | 'drills' | 'long' | 'custom',
    batchNum: number = 1
  ) => {
    setIsLaunchingSession(true);
    setActiveSessionMode(mode);
    setBatchNumber(batchNum);
    setShowAiFixPanel(false);
    setAiFixData(null);
    setTestRun({ isRunning: false, hasRun: false, outcome: null });
    setHasTypedYet(false);
    setGenerativeHtml(null);
    setShowGenerativeVisual(false);
    setSolvedQuestionIds(new Set());

    try {
      let initialProblem: DsaProblem;
      let totalCount = 1;

      if (mode === 'ai-suggested') {
        const bp = getAiSuggestedSessionBlueprint(profile, batchNum);
        totalCount = bp.smallQuestionCount + bp.bigQuestionCount;
        setSecondsLeft(bp.durationMinutes * 60);
        initialProblem = await generateScenarioDsaProblem(
          track.company,
          track.role || 'Software Engineer',
          bp.focusTopics,
          'Medium',
          bp.smallQuestionCount > 0 ? 'drill' : 'long'
        );
      } else if (mode === 'drills') {
        totalCount = 10;
        setSecondsLeft(900); // 15 mins for 10 drills
        initialProblem = await generateScenarioDsaProblem(
          track.company,
          track.role || 'Software Engineer',
          track.focusTopics && track.focusTopics.length > 0 ? track.focusTopics : ['Hash Tables', 'Arrays & Two Pointers'],
          'Easy',
          'drill'
        );
      } else if (mode === 'long') {
        totalCount = 5;
        setSecondsLeft(2700); // 45 mins for 5 problems
        initialProblem = await generateScenarioDsaProblem(
          track.company,
          track.role || 'Software Engineer',
          track.focusTopics && track.focusTopics.length > 0 ? track.focusTopics : ['Algorithms', 'System Invariants'],
          'Medium',
          'long'
        );
      } else {
        // Custom Curated
        totalCount = Math.max(1, customConfig.smallCount + customConfig.bigCount);
        setSecondsLeft(customConfig.durationMinutes * 60);
        initialProblem = await generateScenarioDsaProblem(
          track.company,
          track.role || 'Software Engineer',
          [customConfig.topic],
          customConfig.difficulty,
          customConfig.smallCount > 0 ? 'drill' : 'long'
        );
      }

      // Initialize batch slots
      const initialBatch: DsaProblem[] = [initialProblem];
      for (let i = 1; i < totalCount; i++) {
        const isDrill = mode === 'drills' || (mode === 'ai-suggested' && i < (mode === 'ai-suggested' ? suggestedBlueprint.smallQuestionCount : 1));
        initialBatch.push({
          id: `${track.company.toLowerCase()}-batch-${batchNum}-q${i + 1}-${Date.now() + i}`,
          title: `${track.company} Challenge #${i + 1}`,
          difficulty: isDrill ? 'Easy' : 'Medium',
          category: mode === 'custom' ? customConfig.topic : (track.focusTopics?.[i % (track.focusTopics?.length || 1)] || 'Data Structures'),
          companyTags: [track.company],
          description: `Loading tailored scenario #${i + 1} for ${track.company}... Click to generate or inspect.`,
          functionName: `solveInvariant_${i + 1}`,
          constraints: ['1 <= n <= 10^5', 'Time: O(n)', 'Space: O(1)'],
          examples: [{ input: 'n = 5', output: 'true', explanation: 'Conforms to invariant bounds' }],
          testCases: [{ title: 'Test 1: Verification', input: [5], expected: true, inputStr: 'n=5' }],
          starterCode: {
            javascript: `function solveInvariant_${i + 1}(n) {\n  // Implement invariant solution\n  return true;\n}`,
            python: `def solve_invariant_${i + 1}(n):\n    # Implement invariant solution\n    return True`
          },
          solutionCode: {
            javascript: `function solveInvariant_${i + 1}(n) {\n  return true;\n}`,
            python: `def solve_invariant_${i + 1}(n):\n    return True`
          },
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          interviewCakePedagogy: { conceptBreakdown: 'Core invariant check', commonPitfalls: [] },
          hints: []
        });
      }

      setBatchQuestions(initialBatch);
      setCurrentQuestionIndex(0);
      setSelectedProblem(initialProblem);
      setCode('');
      setHasTypedYet(false);
      setQuestionCodeMap(prev => ({
        ...prev,
        [initialProblem.id]: {
          javascript: '',
          python: ''
        }
      }));
      setIsSessionActive(true);
    } catch (e) {
      console.error("Session launch failed:", e);
    } finally {
      setIsLaunchingSession(false);
    }
  };

  // Switch between questions inside active batch
  const handleSelectQuestionInBatch = async (targetIndex: number) => {
    if (targetIndex === currentQuestionIndex || targetIndex < 0 || targetIndex >= batchQuestions.length) return;

    // Save current problem code
    setQuestionCodeMap(prev => ({
      ...prev,
      [selectedProblem.id]: {
        ...(prev[selectedProblem.id] || { javascript: '', python: '' }),
        [language]: code
      }
    }));

    const nextProblem = batchQuestions[targetIndex];
    setCurrentQuestionIndex(targetIndex);
    setSelectedProblem(nextProblem);
    setShowAiFixPanel(false);
    setAiFixData(null);
    setTestRun({ isRunning: false, hasRun: false, outcome: null });
    // Restore cached visual graphic if available for this problem
    const cachedGraphic = getCachedVisualGraphic(nextProblem.id, nextProblem.title);
    if (cachedGraphic) {
      setGenerativeHtml(cachedGraphic);
      setShowGenerativeVisual(true);
    } else {
      setGenerativeHtml(null);
    }

    // Restore saved code if exists, otherwise keep empty for typing placeholder
    const saved = questionCodeMap[nextProblem.id]?.[language];
    if (saved && saved.trim().length > 0) {
      setCode(saved);
      setHasTypedYet(true);
    } else {
      setCode('');
      setHasTypedYet(false);
    }

    // If next problem was a placeholder, fetch real question seamlessly
    if (nextProblem.description.startsWith('Loading tailored scenario')) {
      try {
        const isDrill = activeSessionMode === 'drills' || (activeSessionMode === 'ai-suggested' && targetIndex < suggestedBlueprint.smallQuestionCount);
        const fetched = await generateScenarioDsaProblem(
          track.company,
          track.role || 'Software Engineer',
          [nextProblem.category],
          nextProblem.difficulty,
          isDrill ? 'drill' : 'long'
        );
        fetched.id = nextProblem.id;
        setBatchQuestions(prev => {
          const updated = [...prev];
          updated[targetIndex] = fetched;
          return updated;
        });
        if (!hasTypedYet) {
          setCode('');
        }
      } catch (err) {
        console.warn("Failed to generate question slot, using fallback:", err);
      }
    }
  };

  // AI Step-by-Step Fixer Handlers
  const handleRequestAiFix = async () => {
    if (!testRun.outcome) return;
    setIsAiFixLoading(true);
    setShowAiFixPanel(true);
    try {
      const fix = await generateStepByStepFix(
        selectedProblem,
        code,
        language,
        testRun.outcome.error,
        testRun.outcome.tests.filter(t => !t.passed)
      );
      setAiFixData(fix);
    } catch (e) {
      console.error("AI fix error:", e);
    } finally {
      setIsAiFixLoading(false);
    }
  };

  const handleApplyAiFix = () => {
    if (!aiFixData?.fixedCode) return;
    setCode(aiFixData.fixedCode);
    setQuestionCodeMap(prev => ({
      ...prev,
      [selectedProblem.id]: {
        ...(prev[selectedProblem.id] || { javascript: '', python: '' }),
        [language]: aiFixData.fixedCode
      }
    }));
    setShowAiFixPanel(false);
  };

  // Toggle Gemini Generative UI Motion Graphic
  const handleToggleGenerativeVisual = async () => {
    if (showGenerativeVisual) {
      setShowGenerativeVisual(false);
      return;
    }
    setShowGenerativeVisual(true);

    // Check persistent cache first so user never needs to regenerate
    const cached = getCachedVisualGraphic(selectedProblem.id, selectedProblem.title);
    if (cached) {
      setGenerativeHtml(cached);
      return;
    }

    if (!generativeHtml) {
      setIsGeneratingVisual(true);
      try {
        const html = await generateInteractiveGraphic(selectedProblem, track.company);
        setGenerativeHtml(html);
        setCachedVisualGraphic(selectedProblem.id, html, selectedProblem.title);
      } catch (err) {
        console.error("Generative UI generation failed:", err);
      } finally {
        setIsGeneratingVisual(false);
      }
    }
  };

  // Save current generative visual explanation to profile vault
  const handleSaveExplanation = () => {
    if (!generativeHtml || !selectedProblem) return;
    const newExplanation: SavedVisualExplanation = {
      id: `expl-${Date.now()}-${selectedProblem.id}`,
      problemId: selectedProblem.id,
      problemTitle: selectedProblem.title,
      category: selectedProblem.category,
      company: track.company,
      htmlContent: generativeHtml,
      savedAt: new Date().toISOString()
    };
    if (onSaveExplanation) {
      onSaveExplanation(newExplanation);
    }
    setSavedExplSuccess(true);
    setTimeout(() => setSavedExplSuccess(false), 3000);
  };

  // Submit Session Flow with Composite 3-Round Scorecard
  const handleSubmitSession = () => {
    setIsSubmitting(true);
    const totalQ = Math.max(1, batchQuestions.length);
    const solvedQ = solvedQuestionIds.size;
    const r1Score = Math.round((solvedQ / totalQ) * 100);
    const r2Score = answeredMcqCount > 0 ? Math.round((correctMcqCount / answeredMcqCount) * 100) : round2Score;
    const r3Score = round3Score ?? 85;
    const compositeScore = Math.round(0.40 * r1Score + 0.30 * r2Score + 0.30 * r3Score);
    const timeSpent = Math.max(1, totalSeconds - secondsLeft);

    const record: TestSessionRecord = {
      id: `session-${Date.now()}`,
      company: track.company,
      role: track.role || 'Software Engineer',
      mode: activeSessionMode,
      batchNumber: batchNumber,
      totalQuestions: totalQ,
      solvedQuestions: solvedQ,
      scorePercentage: compositeScore,
      durationSeconds: timeSpent,
      completedAt: new Date().toISOString(),
      questionTitles: batchQuestions.map(q => q.title),
      round1Score: r1Score,
      round2Score: r2Score,
      round3Score: r3Score,
      totalScore: compositeScore
    };

    if (onSaveTestRecord) {
      onSaveTestRecord(record);
    }

    // Clear active session from localStorage on submit
    try {
      localStorage.removeItem(activeSessionKey);
    } catch {}

    setSubmittedRecord(record);
    setIsSubmitting(false);
    setShowSubmitModal(true);

    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    } catch {}
  };

  // Modals & Panels
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<InterviewClarifyingQuestion[]>([]);

  // Round 2 Adaptive Architecture MCQ State (Zero Preloaded Questions)
  const [mcqList, setMcqList] = useState<McqQuestion[]>([]);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqDifficulty, setMcqDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isLoadingMcqs, setIsLoadingMcqs] = useState(false);
  const [round2Score, setRound2Score] = useState<number>(100);
  const [correctMcqCount, setCorrectMcqCount] = useState<number>(0);
  const [answeredMcqCount, setAnsweredMcqCount] = useState<number>(0);

  // Round 3 Live Voice Debate State
  const [round3Score, setRound3Score] = useState<number | null>(null);

  // Save Explanation State
  const [savedExplSuccess, setSavedExplSuccess] = useState<boolean>(false);

  // Dynamically load adaptive MCQs calibrated to candidate seniority & role
  const loadAdaptiveMcqs = async (diff: 'Easy' | 'Medium' | 'Hard') => {
    setIsLoadingMcqs(true);
    setMcqDifficulty(diff);
    try {
      const generated = await generateAdaptiveMcqs(profile, diff, 4);
      setMcqList(generated);
      setCurrentMcqIndex(0);
      setSelectedMcqAnswer(null);
      setMcqSubmitted(false);
    } catch (e) {
      console.warn("Failed to generate adaptive MCQs:", e);
    } finally {
      setIsLoadingMcqs(false);
    }
  };

  useEffect(() => {
    if (questionMode === 'mcq' && mcqList.length === 0 && !isLoadingMcqs) {
      loadAdaptiveMcqs(mcqDifficulty);
    }
  }, [questionMode]);

  // Mid-Question Socratic Agent Chat
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<Array<{ id: string; sender: 'user' | 'agent'; text: string }>>([
    {
      id: 'init',
      sender: 'agent',
      text: `Stackwa Lead active for your ${track.company} screen. You can talk mid-question: say "bro give me more such questions" or "bruh let's move to mcq" to change the drill anytime.`
    }
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // Timer interval
  useEffect(() => {
    if (!isTimerRunning || secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Run Code with strict assertion execution
  const handleRunCode = async () => {
    setTestRun({ isRunning: true, hasRun: false, outcome: null });

    // Auto-detect language if user pasted Python in JS mode or JS in Python mode
    let effectiveLang = language;
    const isPythonPattern = /^\s*(def\s+|import\s+|from\s+|class\s+|#|elif\s+|lambda\s*:)/m.test(code);
    const isJsPattern = /^\s*(function\s+|const\s+|let\s+|var\s+|\/\/)/m.test(code);
    if (language === 'javascript' && isPythonPattern && !isJsPattern) {
      effectiveLang = 'python';
      setLanguage('python');
    } else if (language === 'python' && isJsPattern && !isPythonPattern) {
      effectiveLang = 'javascript';
      setLanguage('javascript');
    }

    try {
      const outcome = await executeCodeStrict(
        effectiveLang,
        selectedProblem.functionName,
        code,
        selectedProblem.testCases
      );

      setTestRun({
        isRunning: false,
        hasRun: true,
        outcome
      });

      // Only open UI preview dialogue automatically if code contains DOM/UI elements
      const isUiCode = /document\.|innerHTML|createElement|<div>|<button>|className|style|render|return\s*\(|<[A-Z]/i.test(code);
      if (isUiCode) {
        setIsPreviewModalOpen(true);
      }

      if (outcome.allPassed) {
        setSolvedQuestionIds(prev => new Set(prev).add(selectedProblem.id));
        setShowAiFixPanel(false);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (e: any) {
      setTestRun({
        isRunning: false,
        hasRun: true,
        outcome: {
          allPassed: false,
          tests: [],
          executionTimeMs: 0,
          error: e.message || "Runtime exception occurred."
        }
      });
      setIsPreviewModalOpen(true);
    }
  };

  // Mid-Question Conversational Steering
  const handleSendAgentMessage = async () => {
    if (!agentInput.trim() || isAgentTyping) return;
    const text = agentInput.trim();
    setAgentInput('');

    setAgentMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setIsAgentTyping(true);

    const lower = text.toLowerCase();

    // 1. Steering: switch to Live Voice Debate (Round 3)
    if (lower.includes('debate') || lower.includes('voice') || lower.includes('speak') || lower.includes('oral') || lower.includes('round 3')) {
      setQuestionMode('voice-debate');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Round 3: Live Voice Debate Room. Grab your microphone and defend your architecture out loud!"
      }]);
      return;
    }

    // 2. Steering: switch to MCQ (Round 2)
    if (lower.includes('mcq') || lower.includes('quiz') || lower.includes('multiple choice') || lower.includes('round 2')) {
      setQuestionMode('mcq');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Round 2: Adaptive Architecture MCQs. Seniority-calibrated technical reasoning drill active!"
      }]);
      return;
    }

    // 3. Steering: switch to coding / UI Sandbox (Round 1)
    if (lower.includes('code') || lower.includes('algorithm') || lower.includes('coding') || lower.includes('ui') || lower.includes('preview') || lower.includes('round 1')) {
      setQuestionMode('code');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Round 1: Code & UI Sandbox. Implement your algorithmic or UI solution and launch the live sandbox!"
      }]);
      return;
    }
    if (lower.includes('mcq') || lower.includes('quiz') || lower.includes('multiple choice')) {
      setQuestionMode('mcq');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Architecture & System Invariant MCQs. Test your quick technical reasoning above!"
      }]);
      return;
    }

    // 3. Steering: switch to coding
    if (lower.includes('code') || lower.includes('algorithm') || lower.includes('coding')) {
      setQuestionMode('code');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Code Sandbox mode. Implement the core algorithmic invariants and hit 'Run Tests'!"
      }]);
      return;
    }

    // 3. Steering: give more questions of current type
    if (lower.includes('more') || lower.includes('next') || lower.includes('another')) {
      if (questionMode === 'mcq') {
        const nextIdx = (currentMcqIndex + 1) % mcqList.length;
        setCurrentMcqIndex(nextIdx);
        setSelectedMcqAnswer(null);
        setMcqSubmitted(false);
        setIsAgentTyping(false);
        setAgentMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Curated question ${nextIdx + 1} for ${track.company} architecture. Ready above!`
        }]);
        return;
      } else if (questionMode === 'code') {
        const nextProbIdx = (problems.findIndex(p => p.id === selectedProblem.id) + 1) % problems.length;
        const nextProb = problems[nextProbIdx];
        setSelectedProblem(nextProb);
        setCode(nextProb.starterCode[language] || nextProb.starterCode.javascript || '');
        setTestRun({ isRunning: false, hasRun: false, outcome: null });
        setIsAgentTyping(false);
        setAgentMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Loaded challenge "${nextProb.title}" tailored for ${track.company}. Code editor refreshed!`
        }]);
        return;
      }
    }

    // Generic conversational AI response
    try {
      const reply = await askAiCoach(`In the context of a ${track.company} technical screen for ${selectedProblem.title}, candidate asks: "${text}". Reply Socratically and crisply.`);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: reply
      }]);
    } catch {
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Let's keep momentum! Focus on your boundary conditions and edge cases."
      }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  const currentMcq = mcqList[currentMcqIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ================= SESSION TOP BAR ================= */}
      <div className="oled-panel rounded-2xl px-6 py-4 border border-white/10 flex flex-wrap items-center justify-between gap-4 bg-neutral-950/80 backdrop-blur-md">
        
        {/* Left: Exit & Company Context */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (isSessionActive) {
                setShowExitModal(true);
              } else {
                onExit();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Vaults</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">{track.company} Workspace</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold">
                {track.role}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">Dedicated Company Track • Live Rehearsal, Syllabus & AI Lead</p>
          </div>
        </div>

        {/* Center: Company-Scoped Workspace Navigation */}
        <div className="flex items-center p-1 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setWorkspaceTab('rehearsal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              workspaceTab === 'rehearsal' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Rehearsal Screen</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('roadmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              workspaceTab === 'roadmap' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Company Roadmap</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('coach')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              workspaceTab === 'coach' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>3. AI Coach</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('readiness')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              workspaceTab === 'readiness' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>4. Target Readiness</span>
          </button>
        </div>

        {/* Right: Timer & Raise Hand (Only in Rehearsal Screen) */}
        {workspaceTab === 'rehearsal' && (
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              secondsLeft < 300 
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/50 animate-pulse'
                : 'bg-neutral-900 text-white border-white/10'
            }`}>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            <button
              onClick={() => setIsRaiseHandOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition shadow-sm"
            >
              <span>✋</span>
              <span>Raise Hand</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Bar: 3 Round Stages for Rehearsal Screen */}
      {workspaceTab === 'rehearsal' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider">Screen Stage:</span>
            <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => setQuestionMode('code')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  questionMode === 'code' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Round 1: Code & UI Sandbox</span>
              </button>

              <button
                onClick={() => setQuestionMode('mcq')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  questionMode === 'mcq' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Round 2: Adaptive MCQ</span>
              </button>

              <button
                onClick={() => setQuestionMode('voice-debate')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  questionMode === 'voice-debate' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Round 3: Live Voice Debate</span>
              </button>
            </div>
          </div>

          <span className="text-neutral-500 text-[11px]">
            {questionMode === 'code' && 'Invariants, Automated Tests & Side-by-Side UI Match'}
            {questionMode === 'mcq' && 'Adaptive Architectural Tradeoffs (Role-Calibrated)'}
            {questionMode === 'voice-debate' && 'Live Speech Defense & Concurrency Pushback'}
          </span>
        </div>
      )}

      {/* ================= DYNAMIC QUESTION WORKSPACE (REHEARSAL MODE) ================= */}
      {workspaceTab === 'rehearsal' && (
        <>
          <AnimatePresence mode="wait">
        
        {/* MODE 1: CODING SANDBOX */}
        {questionMode === 'code' && (
          <motion.div
            key="code-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-6"
          >
            {/* ----------------- SUB-VIEW A: CLEAN SESSION LAUNCHER (When !isSessionActive) ----------------- */}
            {!isSessionActive ? (
              <div className="oled-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

                {/* Loading Overlay if session is generating */}
                {isLaunchingSession ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                      <Sparkles className="w-6 h-6 text-rose-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        AI Calibrating {track.company} Technical Screen...
                      </h3>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto">
                        Synthesizing real-world production challenge, verified invariants, executable test vectors, and starter code.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            Round 1 Rehearsal Screen
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            Zero Preloaded Clutter
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                          {track.company} Technical Coding Rehearsal
                        </h2>
                        <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                          Select your preparation mode. All problems are 100% dynamically AI-curated for {track.company} ({track.role || 'Software Engineer'}) with crisp, real-world requirements.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono text-neutral-400 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Gemini 3.8 Flash Calibrated</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode 1: AI Suggested (Top & Most Prominent) */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-rose-950/40 via-neutral-900/90 to-black border-2 border-rose-500/30 hover:border-rose-500/60 transition shadow-2xl overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 fill-white" />
                        <span>Recommended • Auto-Pilot</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-8 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <Sparkles className="w-5 h-5" />
                            </span>
                            <div>
                              <h3 className="text-lg font-black text-white tracking-tight">
                                ⚡ AI Suggested Calibration
                              </h3>
                              <p className="text-[11px] text-rose-300 font-mono">
                                Custom mode on auto-pilot • Tailored to your profile & weak spots
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-300 leading-relaxed">
                            {suggestedBlueprint.rationale}
                          </p>

                          {/* AI Selected Recipe Pills */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                            <span className="px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-300 flex items-center space-x-1.5">
                              <Clock className="w-3.5 h-3.5 text-rose-400" />
                              <span>{suggestedBlueprint.durationMinutes} Minutes</span>
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-300 flex items-center space-x-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>{suggestedBlueprint.smallQuestionCount} Quick Drills</span>
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-300 flex items-center space-x-1.5">
                              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{suggestedBlueprint.bigQuestionCount} Deep Problem</span>
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 truncate max-w-xs">
                              Weakness: {suggestedBlueprint.focusTopics[0]}
                            </span>
                          </div>
                        </div>

                        <div className="lg:col-span-4 flex justify-end">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => startSession('ai-suggested')}
                            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 transition flex items-center justify-center space-x-2"
                          >
                            <span>Start AI Calibrated Session</span>
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Mode 2, 3, 4: Quick Drills, Long Problems, Custom Curated */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Mode 2: Quick Drills (10 Questions Batch) */}
                      <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-amber-500/40 transition flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Zap className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                              10 Questions / Batch
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white tracking-tight">
                              ⏱️ Quick Drills
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              Rapid 5–10 min intuition drills testing edge cases, boundary conditions, and fast syntax execution for {track.company}.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                            <span>Batch Format</span>
                            <span className="text-white">10 Drills • Stepper Nav</span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => startSession('drills')}
                            className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <span>Start 10-Drill Batch</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Mode 3: Long Problems (5 Questions Batch) */}
                      <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <Cpu className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                              5 Questions / Batch
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white tracking-tight">
                              🏗️ Long Problems
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              In-depth 30–45 min architectural and algorithmic problems evaluating state invariants, Big-O proof, and system resilience.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                            <span>Batch Format</span>
                            <span className="text-white">5 Deep Problems</span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => startSession('long')}
                            className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <span>Start 5-Problem Batch</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Mode 4: Custom Curated (Manual Pilot) */}
                      <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-purple-500/40 transition flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Sliders className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                              Manual Mix
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white tracking-tight">
                              🎯 Custom Curated
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              Configure your exact mix of drills, deep questions, time limit, and focus topic for {track.company}.
                            </p>
                          </div>

                          {/* Quick Selectors */}
                          <div className="space-y-2 pt-1 text-[11px] font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400">Drills / Big:</span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setCustomConfig(c => ({ ...c, smallCount: Math.max(0, c.smallCount - 1) }))}
                                  className="w-5 h-5 rounded bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/10"
                                >-</button>
                                <span className="text-amber-400 font-bold px-1">{customConfig.smallCount}D</span>
                                <button
                                  onClick={() => setCustomConfig(c => ({ ...c, smallCount: c.smallCount + 1 }))}
                                  className="w-5 h-5 rounded bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/10"
                                >+</button>
                                <span className="text-neutral-500">|</span>
                                <button
                                  onClick={() => setCustomConfig(c => ({ ...c, bigCount: Math.max(0, c.bigCount - 1) }))}
                                  className="w-5 h-5 rounded bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/10"
                                >-</button>
                                <span className="text-cyan-400 font-bold px-1">{customConfig.bigCount}B</span>
                                <button
                                  onClick={() => setCustomConfig(c => ({ ...c, bigCount: c.bigCount + 1 }))}
                                  className="w-5 h-5 rounded bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/10"
                                >+</button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400">Topic:</span>
                              <select
                                value={customConfig.topic}
                                onChange={(e) => setCustomConfig(c => ({ ...c, topic: e.target.value }))}
                                className="bg-black/80 border border-white/10 rounded px-2 py-0.5 text-neutral-200 text-[10px] focus:outline-none focus:border-purple-500"
                              >
                                <option value="Hash Table & Lookup">Hash Table & Lookup</option>
                                <option value="Array & String">Array & String</option>
                                <option value="Sliding Window & Two Pointer">Sliding Window & Two Pointer</option>
                                <option value="Tree & Graph">Tree & Graph</option>
                                <option value="Stack & Queue">Stack & Queue</option>
                                <option value="Dynamic Programming">Dynamic Programming</option>
                                <option value="Full-Stack DOM & Events">Full-Stack DOM & Events</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => startSession('custom')}
                            className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <span>Launch Custom Mix</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ----------------- SUB-VIEW B: ACTIVE CODING SANDBOX ----------------- */
              <div className="space-y-4">
                {/* Active Session Top Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-neutral-900/80 border border-white/10 text-xs font-mono shadow-xl backdrop-blur-md">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {activeSessionMode === 'ai-suggested' && `AI Auto-Pilot • Session #${batchNumber}`}
                        {activeSessionMode === 'drills' && `Quick Drills • Batch #${batchNumber}`}
                        {activeSessionMode === 'long' && `Long Problems • Batch #${batchNumber}`}
                        {activeSessionMode === 'custom' && `Custom Mix • Batch #${batchNumber}`}
                      </span>
                    </span>

                    {/* Batch Stepper Pills */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto max-w-md py-0.5">
                      {batchQuestions.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex;
                        const isSolved = solvedQuestionIds.has(q.id);
                        return (
                          <button
                            key={q.id || idx}
                            onClick={() => handleSelectQuestionInBatch(idx)}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
                              isCurrent
                                ? 'bg-white text-black shadow-lg shadow-white/10 ring-2 ring-rose-500'
                                : isSolved
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60'
                                : 'bg-black/60 text-neutral-400 border border-white/5 hover:text-white hover:bg-white/5'
                            }`}
                            title={q.title}
                          >
                            <span>Q{idx + 1}</span>
                            {isSolved && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions: Next Batch & End Session */}
                  <div className="flex items-center space-x-2">
                    {/* If on final question of batch, render "Generate Next Batch" button */}
                    {currentQuestionIndex === batchQuestions.length - 1 && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => startSession(activeSessionMode, batchNumber + 1)}
                        disabled={isLaunchingSession}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLaunchingSession ? 'animate-spin' : ''}`} />
                        <span>Generate Next Batch of {activeSessionMode === 'drills' ? '10' : activeSessionMode === 'long' ? '5' : 'Questions'} →</span>
                      </motion.button>
                    )}

                    <button
                      onClick={() => setShowExitModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs transition"
                      title="Return to mode selector"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                      <span>End / Change Mode</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Problem & Code Sandbox */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Problem Spec (5 cols) */}
                  <div className="lg:col-span-5 oled-panel rounded-2xl p-6 border border-white/10 space-y-4 max-h-[640px] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold font-mono">
                          {selectedProblem.category}
                        </span>
                        {selectedProblem.isUiChallenge && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold font-mono uppercase flex items-center space-x-1">
                            <Layout className="w-3 h-3 text-rose-400" />
                            <span>UI / Frontend</span>
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">
                          {track.company}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                          {selectedProblem.difficulty}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-neutral-400">
                        Q{currentQuestionIndex + 1} of {batchQuestions.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span>Live Technical Scenario</span>
                      <span>Target: <strong className="text-white">{selectedProblem.timeComplexity}</strong></span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white tracking-tight">{selectedProblem.title}</h3>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{selectedProblem.description}</p>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Constraints & Invariants:</span>
                      <ul className="text-xs text-neutral-300 space-y-1 font-mono">
                        {selectedProblem.constraints.map((c, i) => (
                          <li key={i} className="text-[11px]">• {c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactive AI Motion Graphic (Generative UI) */}
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <button
                        onClick={handleToggleGenerativeVisual}
                        className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                          showGenerativeVisual
                            ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-rose-400" />
                        <span>{showGenerativeVisual ? 'Hide Interactive Visual Solution' : '⚡ Generate Interactive Visual Solution'}</span>
                      </button>

                      {showGenerativeVisual && (
                        <div className="rounded-2xl border border-white/10 bg-black/80 overflow-hidden p-3 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                            <span className="flex items-center space-x-1.5 text-rose-400 font-bold">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Step-by-Step Visual Execution Model</span>
                            </span>
                            <div className="flex items-center space-x-2">
                              {isGeneratingVisual && (
                                <span className="text-amber-400 flex items-center space-x-1 animate-pulse">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Synthesizing...</span>
                                </span>
                              )}
                              {generativeHtml && (
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={handleSaveExplanation}
                                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase transition shadow-sm ${
                                      savedExplSuccess 
                                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' 
                                        : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border-amber-500/30'
                                    }`}
                                    title="Save to your Profile Vault"
                                  >
                                    <Star className={`w-3 h-3 ${savedExplSuccess ? 'fill-emerald-400 text-emerald-400' : 'fill-amber-400 text-amber-400'}`} />
                                    <span>{savedExplSuccess ? 'Saved!' : 'Save'}</span>
                                  </button>
                                  <button
                                    onClick={() => setIsVisualFullScreen(true)}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[10px] uppercase transition shadow-sm"
                                    title="Expand to Fullscreen"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span>Fullscreen</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Fullscreen Suggestion Prompt Banner */}
                          {generativeHtml && !isGeneratingVisual && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-black border border-rose-500/30 text-[11px] font-mono text-rose-300">
                              <span className="flex items-center space-x-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>💡 Pro-Tip: Open in Full Screen for the best step-by-step visual intuition!</span>
                              </span>
                              <button
                                onClick={() => setIsVisualFullScreen(true)}
                                className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase transition shadow-md shadow-rose-600/30"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Watch Fullscreen</span>
                              </button>
                            </div>
                          )}

                          {isGeneratingVisual ? (
                            <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-neutral-950/60 rounded-xl">
                              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                              <p className="text-xs font-mono text-neutral-400">
                                Gemini 3.8 Flash is crafting an interactive motion diagram...
                              </p>
                            </div>
                          ) : generativeHtml ? (
                            <iframe
                              srcDoc={generativeHtml}
                              title="Interactive Visual Solution"
                              sandbox="allow-scripts"
                              className="w-full h-80 rounded-xl border border-white/10 bg-neutral-950"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Code Editor & Execution Actions (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col space-y-4">
                    <div className={`rounded-2xl border border-white/10 bg-black overflow-hidden flex flex-col shadow-2xl relative ${
                      testRun.isRunning ? 'compiling-overdrive' : ''
                    }`}>
                      {/* Editor Bar */}
                      <div className="px-5 py-3 bg-neutral-900/90 border-b border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="font-mono text-neutral-300 font-bold">
                              {language === 'javascript' ? 'solution.js' : 'solution.py'}
                            </span>
                          </div>

                          {/* Language Switcher */}
                          <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px]">
                            <button
                              onClick={() => handleSwitchLanguage('javascript')}
                              className={`px-2.5 py-0.5 rounded-md transition ${
                                language === 'javascript' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              JavaScript
                            </button>
                            <button
                              onClick={() => handleSwitchLanguage('python')}
                              className={`px-2.5 py-0.5 rounded-md transition ${
                                language === 'python' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              Python
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const starter = typeof selectedProblem.starterCode === 'string'
                                ? selectedProblem.starterCode
                                : (selectedProblem.starterCode[language] || selectedProblem.starterCode.javascript || '');
                              setCode(starter);
                              setHasTypedYet(true);
                            }}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition text-xs font-mono"
                            title="Insert clean function boilerplate"
                          >
                            <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Load Skeleton</span>
                          </button>

                          <button
                            onClick={() => setIsPreviewModalOpen(true)}
                            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition text-xs font-mono"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-400" />
                            <span>Live UI Preview</span>
                          </button>
                        </div>
                      </div>

                      {/* Monaco Editor Surface with Forward/Reverse Typing Particles & Animated Typewriter Placeholder */}
                      <div ref={editorContainerRef} className="relative min-h-[380px] bg-black">
                        <MonacoTypingEffectOverlay 
                          containerRef={editorContainerRef} 
                          editorInstance={editorInstance} 
                        />

                        {!hasTypedYet && code.trim().length === 0 && (
                          <div 
                            className="absolute top-3 left-14 z-10 pointer-events-none select-none font-mono text-sm text-neutral-500 flex items-center space-x-1"
                          >
                            <span>{language === 'python' ? '# Start typing your solution here...' : '// Start typing your solution here...'}</span>
                            <span className="w-2 h-4 bg-rose-500 inline-block animate-pulse" />
                          </div>
                        )}

                        <Editor
                          height="380px"
                          language={language === 'python' ? 'python' : 'javascript'}
                          theme="vs-dark"
                          value={code}
                          onMount={(editor) => {
                            setEditorInstance(editor);
                          }}
                          onChange={(val) => {
                            setCode(val || '');
                            if (!hasTypedYet && (val || '').length > 0) {
                              setHasTypedYet(true);
                            }
                          }}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                            padding: { top: 12, bottom: 12 },
                            fontFamily: 'Fira Code, JetBrains Mono, Menlo, monospace',
                            fontLigatures: true,
                            suggestOnTriggerCharacters: true
                          }}
                        />
                      </div>

                      {/* Inline Test Results, Terminal & Step-by-Step AI Fixer */}
                      {testRun.hasRun && testRun.outcome && (
                        <div className="p-4 bg-neutral-950 border-t border-white/10 text-xs font-mono space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {testRun.outcome.allPassed ? (
                                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>All Invariants Verified & Conforming!</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>
                                    {testRun.outcome.tests.length > 0 
                                      ? `${testRun.outcome.tests.filter(t => t.passed).length}/${testRun.outcome.tests.length} Assertions Passed` 
                                      : 'Syntax / Execution Issue'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-neutral-400 text-[11px]">
                              <span>{testRun.outcome.executionTimeMs}ms execution</span>
                              <button
                                onClick={() => setIsPreviewModalOpen(true)}
                                className="text-rose-400 hover:text-white underline transition"
                              >
                                Inspect Output →
                              </button>
                            </div>
                          </div>

                          {/* Individual Test Assertions */}
                          {testRun.outcome.tests.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                              {testRun.outcome.tests.map((t, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-2.5 rounded-xl border ${
                                    t.passed 
                                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                                      : 'bg-rose-950/20 border-rose-500/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-bold text-white truncate mr-1">{t.title}</span>
                                    <span className={t.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                      {t.passed ? '✓ PASS' : '✗ FAIL'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-neutral-400 space-y-0.5">
                                    <div className="truncate">Expected: <span className="text-emerald-300 font-mono">{t.expected}</span></div>
                                    <div className="truncate">Actual: <span className={t.passed ? 'text-neutral-200 font-mono' : 'text-rose-300 font-mono'}>{t.actual}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Backend Stdout logs */}
                          {testRun.outcome.stdout && (
                            <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
                              <div className="flex items-center space-x-1.5 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
                                <Terminal className="w-3 h-3 text-rose-400" />
                                <span>Console & Terminal (stdout):</span>
                              </div>
                              <pre className="font-mono text-xs text-neutral-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {testRun.outcome.stdout}
                              </pre>
                            </div>
                          )}

                          {testRun.outcome.error && (
                            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                              ⚠️ {testRun.outcome.error}
                            </div>
                          )}

                          {/* ================= STEP-BY-STEP AI FIXER ================= */}
                          {(!testRun.outcome.allPassed || testRun.outcome.error) && (
                            <div className="pt-2 border-t border-white/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] text-neutral-400 font-mono">
                                  Need help debugging? Let the AI analyze the error and guide you step by step.
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleRequestAiFix}
                                  disabled={isAiFixLoading}
                                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition disabled:opacity-50"
                                >
                                  <Wrench className={`w-3.5 h-3.5 ${isAiFixLoading ? 'animate-spin' : ''}`} />
                                  <span>{isAiFixLoading ? 'Analyzing Code & Invariants...' : '🧠 AI Step-by-Step Fixer'}</span>
                                </motion.button>
                              </div>

                              {/* Expanded AI Fix Drawer / Card */}
                              {showAiFixPanel && aiFixData && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="p-4 rounded-xl bg-neutral-900/90 border border-rose-500/30 space-y-4 text-xs font-mono"
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                                        Root Cause
                                      </span>
                                      <span className="text-white font-semibold">
                                        {aiFixData.rootCause}
                                      </span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                      {aiFixData.conceptBroken}
                                    </span>
                                  </div>

                                  {/* Step-by-Step Instructions */}
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400">Step-by-Step Resolution:</span>
                                    <div className="space-y-1">
                                      {aiFixData.steps.map((st, sIdx) => (
                                        <div key={sIdx} className="p-2 rounded-lg bg-black/60 border border-white/5 text-neutral-300 flex items-start space-x-2">
                                          <span className="w-5 h-5 rounded-full bg-rose-600/30 text-rose-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                            {sIdx + 1}
                                          </span>
                                          <span className="text-[11px] leading-relaxed">{st}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-neutral-400 leading-relaxed italic bg-black/40 p-2.5 rounded-lg border border-white/5">
                                    "{aiFixData.explanation}"
                                  </p>

                                  {/* Action: Apply Fix Directly to Editor */}
                                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                                    <button
                                      onClick={() => setShowAiFixPanel(false)}
                                      className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white transition text-xs"
                                    >
                                      Dismiss
                                    </button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={handleApplyAiFix}
                                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Apply Fix to Editor</span>
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Editor Footer Action */}
                      <div className="px-5 py-3.5 bg-neutral-900/90 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-neutral-400">
                          Target: <strong className="text-white">{selectedProblem.timeComplexity}</strong>
                        </span>

                        <div className="flex items-center space-x-2.5">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={handleRunCode}
                            disabled={testRun.isRunning}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-bold text-xs border border-white/10 transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>{testRun.isRunning ? 'Executing...' : 'Run Tests & Preview'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmitSession}
                            disabled={isSubmitting}
                            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Recording...' : 'Submit Test'}</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* ROUND 2: ADAPTIVE ROLE-CALIBRATED ARCHITECTURE MCQ */}
        {questionMode === 'mcq' && (
          <motion.div
            key="mcq-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="max-w-3xl mx-auto oled-panel rounded-3xl p-8 border border-white/10 space-y-6"
          >
            {/* Top Bar with Difficulty Selector & Seniority Calibrator */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-rose-400 uppercase font-bold tracking-wider">
                    Round 2: Adaptive Architecture MCQ
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">
                    {profile?.seniority || 'Mid-Level'} Seniority Calibrated
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  {mcqList.length > 0 ? `Question ${currentMcqIndex + 1} of ${mcqList.length}` : 'Calibrating Questions...'}
                </div>
              </div>

              {/* Difficulty Switcher */}
              <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <span className="text-[10px] text-neutral-500 uppercase px-1 font-bold">Difficulty:</span>
                {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => loadAdaptiveMcqs(diff)}
                    disabled={isLoadingMcqs}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                      mcqDifficulty === diff 
                        ? 'bg-rose-600 text-white font-bold' 
                        : 'text-neutral-400 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingMcqs ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-neutral-400">
                <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                <span>Gemini 3.8 Flash is calibrating {mcqDifficulty} questions for your {profile?.seniority || 'Mid-Level'} track...</span>
              </div>
            ) : currentMcq ? (
              <>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span>Category: <strong className="text-neutral-300">{currentMcq.category || 'Architecture Tradeoff'}</strong></span>
                  <span className="text-rose-400 font-bold">{currentMcq.difficulty || mcqDifficulty}</span>
                </div>

                <h3 className="text-base font-bold text-white leading-relaxed">
                  {currentMcq.question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {currentMcq.options.map((opt, i) => {
                    const isSelected = selectedMcqAnswer === i;
                    const isCorrect = currentMcq.correctIndex === i;

                    let style = 'bg-neutral-900 border-white/10 text-neutral-200 hover:border-white/20';
                    if (mcqSubmitted) {
                      if (isCorrect) style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                      else if (isSelected && !isCorrect) style = 'bg-rose-950/40 border-rose-500 text-rose-200';
                    } else if (isSelected) {
                      style = 'bg-rose-600/20 border-rose-500 text-white font-semibold';
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => !mcqSubmitted && setSelectedMcqAnswer(i)}
                        className={`p-4 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${style}`}
                      >
                        <span className="pr-3 leading-relaxed">{opt}</span>
                        {mcqSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Socratic Explanation */}
                {mcqSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300 leading-relaxed font-mono space-y-1"
                  >
                    <strong className="text-rose-400 block font-bold">Architectural Invariant Breakdown:</strong>
                    <p>{currentMcq.explanation}</p>
                  </motion.div>
                )}

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-neutral-500">
                    {answeredMcqCount > 0 && `Score: ${Math.round((correctMcqCount / answeredMcqCount) * 100)}% (${correctMcqCount}/${answeredMcqCount} Correct)`}
                  </div>

                  {!mcqSubmitted ? (
                    <button
                      onClick={() => {
                        if (selectedMcqAnswer === null) return;
                        setMcqSubmitted(true);
                        const isCorrect = selectedMcqAnswer === currentMcq.correctIndex;
                        const newAnswered = answeredMcqCount + 1;
                        const newCorrect = isCorrect ? correctMcqCount + 1 : correctMcqCount;
                        setAnsweredMcqCount(newAnswered);
                        if (isCorrect) {
                          setCorrectMcqCount(newCorrect);
                        }
                        setRound2Score(Math.round((newCorrect / newAnswered) * 100));
                      }}
                      disabled={selectedMcqAnswer === null}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition"
                    >
                      Verify Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (currentMcqIndex + 1 < mcqList.length) {
                          setCurrentMcqIndex(prev => prev + 1);
                        } else {
                          loadAdaptiveMcqs(mcqDifficulty);
                        }
                        setSelectedMcqAnswer(null);
                        setMcqSubmitted(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                    >
                      {currentMcqIndex + 1 < mcqList.length ? 'Next Adaptive MCQ →' : 'Generate New Batch →'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 font-mono space-y-3">
                <p>No questions currently calibrated.</p>
                <button
                  onClick={() => loadAdaptiveMcqs(mcqDifficulty)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Fetch Adaptive Questions
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ROUND 3: LIVE VOICE DEBATE */}
        {questionMode === 'voice-debate' && (
          <motion.div
            key="voice-debate-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full"
          >
            <VoiceDebateRoom
              role={track.role || 'Software Engineer'}
              company={track.company}
              problemTitle={selectedProblem.title}
              problemCategory={selectedProblem.category}
              problemCode={code}
              existingScore={round3Score}
              onConcludeDebate={(evaluationResult) => {
                setRound3Score(evaluationResult.round3Score);
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ================= MID-QUESTION CONVERSATIONAL AGENT ================= */}
      <div className="oled-panel rounded-2xl border border-white/10 bg-neutral-950/90 overflow-hidden shadow-xl">
        <div className="px-5 py-2.5 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Bot className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold text-white">Live Mid-Question Interviewer Steering</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Say "bro give me more such questions" or "bruh let's move to mcq"
          </span>
        </div>

        {/* Message Log */}
        <div className="p-4 max-h-32 overflow-y-auto space-y-2 text-xs">
          {agentMessages.slice(-2).map(m => (
            <div key={m.id} className={`flex items-start space-x-2 ${m.sender === 'user' ? 'justify-end' : ''}`}>
              <div className={`px-3 py-1.5 rounded-xl leading-relaxed ${
                m.sender === 'user' ? 'bg-rose-600 text-white' : 'bg-neutral-900 text-neutral-300 border border-white/5'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isAgentTyping && (
            <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-mono">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Interviewer adjusting session...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-black/60 flex items-center space-x-2">
          <input
            type="text"
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAgentMessage()}
            placeholder="Talk mid-question to adjust pacing or request more questions..."
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
          />
          <button
            onClick={handleSendAgentMessage}
            disabled={!agentInput.trim() || isAgentTyping}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </>
  )}

  {/* ================= COMPANY ROADMAP TAB ================= */}
  {workspaceTab === 'roadmap' && (
    <motion.div
      key="roadmap-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <RoadmapView
        profile={{
          ...(profile || {}),
          targetCompany: track.company || profile?.targetCompany || 'Tech Company',
          role: track.role || profile?.role || 'Software Engineer',
          seniority: profile?.seniority || 'Senior',
          interviewDate: profile?.interviewDate || track.dateLabel || '',
          daysRemaining: track.daysRemaining || profile?.daysRemaining || 7,
          focusAreas: track.focusTopics || profile?.focusAreas || ['System Architecture', 'Algorithmic Optimization'],
          calendarConnected: false,
          onboardingCompleted: true,
          isGeneralPractice: false
        }}
        roadmap={
          roadmap.length > 0 && roadmap[0]?.theme.toLowerCase().includes((track.company || '').toLowerCase())
            ? roadmap
            : generateHighEffortRoadmap(track.company, track.role, track.daysRemaining || 7, track.focusTopics)
        }
        onToggleDay={onToggleDay || (() => {})}
        onOpenSettings={onOpenSettings || (() => {})}
        setActiveTab={() => {}}
      />
    </motion.div>
  )}

  {/* ================= AI MOCK COACH TAB ================= */}
  {workspaceTab === 'coach' && (
    <motion.div
      key="coach-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <AiMockRoom
        solvedCount={solvedCount}
        completedFlowsCount={completedFlowsCount}
      />
    </motion.div>
  )}

  {/* ================= TARGET READINESS TAB ================= */}
  {workspaceTab === 'readiness' && (
    <motion.div
      key="readiness-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <ProgressDashboard
        solvedCount={solvedCount}
        totalProblems={problems.length}
        completedFlowsCount={completedFlowsCount}
        totalFlows={UI_CHALLENGES.length}
        streakDays={streakDays}
        profile={profile}
        setActiveTab={() => {}}
      />
    </motion.div>
  )}

      {/* ================= MODALS ================= */}
      <LiveUiPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        code={code}
        language={language}
        functionName={selectedProblem.functionName}
        outcome={testRun.outcome}
        onReRun={handleRunCode}
        title={selectedProblem.title}
        referenceUiCode={selectedProblem.referenceUiCode}
        isUiChallenge={selectedProblem.isUiChallenge}
        testCases={selectedProblem.testCases}
        solutionCode={selectedProblem.solutionCode?.[language] || selectedProblem.solutionCode?.javascript}
        description={selectedProblem.description}
      />

      <RaiseHandModal
        isOpen={isRaiseHandOpen}
        onClose={() => setIsRaiseHandOpen(false)}
        problem={selectedProblem}
        clarifyingQuestions={clarifyingQuestions}
        onAddQuestion={(q) => setClarifyingQuestions(prev => [...prev, q])}
      />

      {/* ================= EXIT CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">End Active Rehearsal?</h3>
                  <p className="text-xs text-neutral-400">Confirmation Required</p>
                </div>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">
                Do you really want to end this session? If you exit without submitting, this test session will not be recorded in your profile.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition"
                >
                  Stay in Test
                </button>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(activeSessionKey);
                    } catch {}
                    setShowExitModal(false);
                    setIsSessionActive(false);
                    onExit();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
                >
                  Exit Without Saving
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= SUBMIT TEST & SCORECARD MODAL ================= */}
      <AnimatePresence>
        {showSubmitModal && submittedRecord && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-lg w-full bg-gradient-to-b from-neutral-900 to-black border-2 border-emerald-500/40 rounded-3xl p-7 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Award className="w-7 h-7 text-emerald-400" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      Test Completed & Synced
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Session Performance Scorecard
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3-Round Composite Score Breakdown */}
              <div className="grid grid-cols-4 gap-2 font-mono text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
                  <div className="text-[9px] text-emerald-300 uppercase tracking-wider font-bold">Total Score</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{submittedRecord.totalScore ?? submittedRecord.scorePercentage}/100</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5">
                  <div className="text-[9px] text-neutral-400 uppercase tracking-wider">R1: Code & UI</div>
                  <div className="text-lg font-black text-rose-400 mt-1">{submittedRecord.round1Score ?? 0}%</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5">
                  <div className="text-[9px] text-neutral-400 uppercase tracking-wider">R2: MCQ</div>
                  <div className="text-lg font-black text-blue-400 mt-1">{submittedRecord.round2Score ?? 0}%</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5">
                  <div className="text-[9px] text-neutral-400 uppercase tracking-wider">R3: Debate</div>
                  <div className="text-lg font-black text-purple-400 mt-1">{submittedRecord.round3Score ?? 0}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5">
                  <div className="text-[10px] text-neutral-400 uppercase">Code Solved</div>
                  <div className="text-base font-bold text-white mt-0.5">{submittedRecord.solvedQuestions}/{submittedRecord.totalQuestions}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5">
                  <div className="text-[10px] text-neutral-400 uppercase">Total Time Spent</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{Math.floor(submittedRecord.durationSeconds / 60)}m {submittedRecord.durationSeconds % 60}s</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Target Track:</span>
                  <span className="text-white font-bold">{submittedRecord.company} ({submittedRecord.role})</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Mode:</span>
                  <span className="text-rose-300 font-bold uppercase">{submittedRecord.mode} • Batch #{submittedRecord.batchNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Synced to Profile:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vault History Updated</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setWorkspaceTab('readiness');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 text-xs font-semibold transition"
                >
                  <span>View in Target Readiness</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 inline" />
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setIsSessionActive(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= GENERATIVE UI FULLSCREEN VIEW ================= */}
      <AnimatePresence>
        {isVisualFullScreen && generativeHtml && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 overflow-hidden">
            {/* Fullscreen Top Navigation Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsVisualFullScreen(false)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sandbox</span>
                </button>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold font-mono">
                      {track.company} • {selectedProblem.category}
                    </span>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      {selectedProblem.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Interactive Step-by-Step Invariant Model • Native HTML5 / Canvas Engine
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveExplanation}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition shadow-sm ${
                    savedExplSuccess
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border-amber-500/30'
                  }`}
                  title="Save Explanation to Profile Vault"
                >
                  <Star className={`w-3.5 h-3.5 ${savedExplSuccess ? 'fill-emerald-400 text-emerald-400' : 'fill-amber-400 text-amber-400'}`} />
                  <span>{savedExplSuccess ? 'Saved to Vault!' : 'Save Explanation'}</span>
                </button>
                <button
                  onClick={() => setIsVisualFullScreen(false)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 text-xs font-mono transition"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </button>
                <button
                  onClick={() => setIsVisualFullScreen(false)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition"
                  title="Close Fullscreen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fullscreen Iframe Surface */}
            <div className="flex-1 w-full mt-4 rounded-2xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl relative">
              <iframe
                srcDoc={generativeHtml}
                title={`${selectedProblem.title} - Fullscreen Visual Model`}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
