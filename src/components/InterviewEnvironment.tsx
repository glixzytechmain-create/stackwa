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
  Video, 
  Eye,
  Check,
  Layout,
  Cpu,
  CheckCircle2,
  Box,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DsaProblem, InterviewClarifyingQuestion } from '../types';
import { InterviewTrack } from './InterviewCard';
import { DSA_PROBLEMS } from '../data/dsaProblems';
import { UI_CHALLENGES } from '../data/uiFlows';
import { executeCodeStrict, ExecutionOutcome } from '../services/codeExecutionService';
import { askAiCoach } from '../services/aiService';
import { sendAnakinChatMessage } from '../services/anakinService';
import { ScrimbaPlayer } from './ScrimbaPlayer';
import { LiveUiPreviewModal } from './LiveUiPreviewModal';
import { RaiseHandModal } from './RaiseHandModal';
import { TypingSparksOverlay } from './TypingSparksOverlay';
import confetti from 'canvas-confetti';

interface InterviewEnvironmentProps {
  track: InterviewTrack;
  onExit: () => void;
  customProblems?: DsaProblem[];
}

export type QuestionMode = 'code' | 'mobbin-ui' | 'mcq' | 'system-reasoning';

interface McqQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const DEFAULT_MCQS: McqQuestion[] = [
  {
    id: 'mcq-1',
    question: "When architecting a high-throughput API gateway with sliding-window rate limiting, why is a sorted monotonic set preferred over a Redis INCR counter?",
    options: [
      "Monotonic sets guarantee sub-millisecond precision without atomic race-condition resets at window borders.",
      "Redis INCR consumes O(N) memory per client while monotonic sets use O(1).",
      "Monotonic sets eliminate the need for TLS encryption in transit.",
      "INCR counters do not support clustering or distributed master-slave nodes."
    ],
    correctIndex: 0,
    explanation: "Fixed INCR counters suffer from boundary bursts (e.g. 2x limit arriving at window seams), whereas monotonic sliding sets strictly measure elapsed time deltas."
  },
  {
    id: 'mcq-2',
    question: "In React 19, what happens to optimistic UI mutations if the underlying server request rejects with an HTTP 409 conflict?",
    options: [
      "The entire component tree crashes with an UnhandledRejection error.",
      "useOptimistic automatically rolls state back to the previous immutable snapshot.",
      "The browser forcibly refreshes the page to reconcile state.",
      "The mutation persists permanently in localStorage."
    ],
    correctIndex: 1,
    explanation: "React's optimistic dispatch rolls state back to the server-confirmed snapshot automatically when the mutation action promise rejects."
  }
];

export const InterviewEnvironment: React.FC<InterviewEnvironmentProps> = ({
  track,
  onExit,
  customProblems = []
}) => {
  const problems = [...customProblems, ...DSA_PROBLEMS];
  const [selectedProblem, setSelectedProblem] = useState<DsaProblem>(problems[0]);
  const [questionMode, setQuestionMode] = useState<QuestionMode>('code');
  
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

  // Language switch handler
  const handleSwitchLanguage = (newLang: 'javascript' | 'python') => {
    setLanguage(newLang);
    const starter = typeof selectedProblem.starterCode === 'string'
      ? selectedProblem.starterCode
      : (selectedProblem.starterCode[newLang] || selectedProblem.starterCode.javascript || '');
    setCode(starter);
  };

  // Mobbin UI Round 2 State
  const [selectedUiChallenge, setSelectedUiChallenge] = useState(UI_CHALLENGES[0]);
  const [activeUiSection, setActiveUiSection] = useState<'hierarchy' | 'state' | 'edge-cases' | 'quiz'>('hierarchy');
  const [mobbinQuizAnswer, setMobbinQuizAnswer] = useState<number | null>(null);
  const [mobbinQuizSubmitted, setMobbinQuizSubmitted] = useState(false);

  // Evaluator Engine (Gemini 3.8 Flash vs Anakin.ai Agent)
  const [evaluatorEngine, setEvaluatorEngine] = useState<'gemini' | 'anakin'>('gemini');

  // Modals & Panels
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<InterviewClarifyingQuestion[]>([]);
  const [showScrimbaExplainer, setShowScrimbaExplainer] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Timer Countdown (15m, 30m, 45m)
  const totalSeconds = track.intensity === '15m' ? 900 : track.intensity === '30m' ? 1800 : 2700;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isTimerRunning] = useState(true);

  // Architecture MCQ State
  const [mcqList] = useState<McqQuestion[]>(DEFAULT_MCQS);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  // System Reasoning State
  const [reasoningPrompt] = useState<string>(
    `In ${track.company}'s distributed environment, how would you design an idempotent payment transaction ledger to eliminate duplicate debits under 500ms network timeouts?`
  );
  const [reasoningAnswer, setReasoningAnswer] = useState<string>('');
  const [reasoningFeedback, setReasoningFeedback] = useState<string | null>(null);
  const [isEvaluatingReasoning, setIsEvaluatingReasoning] = useState(false);

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

    try {
      const outcome = await executeCodeStrict(
        language,
        selectedProblem.functionName,
        code,
        selectedProblem.testCases
      );

      setTestRun({
        isRunning: false,
        hasRun: true,
        outcome
      });

      // Automatically open live UI & Execution preview dialogue box
      setIsPreviewModalOpen(true);

      if (outcome.allPassed) {
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

  // Evaluate System Reasoning Question
  const handleEvaluateReasoning = async () => {
    if (!reasoningAnswer.trim()) return;
    setIsEvaluatingReasoning(true);

    const prompt = `As a Principal Engineer at ${track.company}, evaluate this candidate's technical reasoning.
Question: ${reasoningPrompt}
Candidate Answer: ${reasoningAnswer}
Evaluate on: 1. Invariant Preservation, 2. Concurrency/Idempotency, 3. Defensive Edge Cases. Give a crisp 2-sentence grade and recommendation.`;

    if (evaluatorEngine === 'anakin') {
      try {
        const anakinRes = await sendAnakinChatMessage(prompt);
        if (anakinRes.success && anakinRes.reply) {
          setReasoningFeedback(`[Anakin.ai Studio Agent]: ${anakinRes.reply}`);
        } else {
          const reply = await askAiCoach(prompt);
          setReasoningFeedback(`[Anakin Token Active • Gemini Engine]: ${reply}`);
        }
      } catch {
        const reply = await askAiCoach(prompt);
        setReasoningFeedback(reply);
      }
    } else {
      const reply = await askAiCoach(prompt);
      setReasoningFeedback(reply);
    }
    setIsEvaluatingReasoning(false);
  };

  // Mid-Question Conversational Steering
  const handleSendAgentMessage = async () => {
    if (!agentInput.trim() || isAgentTyping) return;
    const text = agentInput.trim();
    setAgentInput('');

    setAgentMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setIsAgentTyping(true);

    const lower = text.toLowerCase();

    // 1. Steering: switch to Mobbin UI
    if (lower.includes('mobbin') || lower.includes('ui') || lower.includes('design') || lower.includes('component')) {
      setQuestionMode('mobbin-ui');
      setIsAgentTyping(false);
      setAgentMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Switched to Round 2: Mobbin Production UI Architecture. Explore component trees and state boundaries above!"
      }]);
      return;
    }

    // 2. Steering: switch to MCQ
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

  const currentMcq = mcqList[currentMcqIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ================= SESSION TOP BAR ================= */}
      <div className="oled-panel rounded-2xl px-6 py-4 border border-white/10 flex flex-wrap items-center justify-between gap-4 bg-neutral-950/80 backdrop-blur-md">
        
        {/* Left: Exit & Company Context */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Vaults</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">{track.company} Environment</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold">
                {track.role}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">Scoped Interview Session • Live Invariant Engine</p>
          </div>
        </div>

        {/* Center: Interview Rounds (DSA, Mobbin UI, System MCQ, Socratic Defense) */}
        <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setQuestionMode('code')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              questionMode === 'code' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>1. Code</span>
          </button>

          <button
            onClick={() => setQuestionMode('mobbin-ui')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              questionMode === 'mobbin-ui' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>2. Mobbin UI</span>
          </button>

          <button
            onClick={() => setQuestionMode('mcq')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              questionMode === 'mcq' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. System MCQ</span>
          </button>

          <button
            onClick={() => setQuestionMode('system-reasoning')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              questionMode === 'system-reasoning' ? 'bg-rose-600 text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Socratic Defense</span>
          </button>
        </div>

        {/* Right: Timer & Raise Hand */}
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
      </div>

      {/* ================= DYNAMIC QUESTION WORKSPACE ================= */}
      <AnimatePresence mode="wait">
        
        {/* MODE 1: CODING SANDBOX */}
        {questionMode === 'code' && (
          <motion.div
            key="code-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Problem Spec (5 cols) */}
            <div className="lg:col-span-5 oled-panel rounded-2xl p-6 border border-white/10 space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold font-mono">
                  {selectedProblem.category}
                </span>
                <span className="text-xs font-mono text-neutral-400">Target: {selectedProblem.timeComplexity}</span>
              </div>

              <h3 className="text-lg font-extrabold text-white tracking-tight">{selectedProblem.title}</h3>
              <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{selectedProblem.description}</p>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Constraints:</span>
                <ul className="text-xs text-neutral-300 space-y-1 font-mono">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i} className="text-[11px]">• {c}</li>
                  ))}
                </ul>
              </div>

              {/* Scrimba Official Explainer Toggle */}
              <div className="pt-3 border-t border-white/5">
                <button
                  onClick={() => setShowScrimbaExplainer(prev => !prev)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>{showScrimbaExplainer ? 'Hide Scrimba Codecast' : 'Open Official Scrimba Codecast'}</span>
                </button>
              </div>

              {showScrimbaExplainer && (
                <div className="pt-2">
                  <ScrimbaPlayer problem={selectedProblem} userCode={code} />
                </div>
              )}
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
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition text-xs font-mono"
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      <span>Live UI Preview</span>
                    </button>
                  </div>
                </div>

                {/* Editor Surface */}
                <div className="relative min-h-[380px] p-4 bg-black">
                  <TypingSparksOverlay textareaRef={editorRef} />
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full min-h-[360px] bg-transparent text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-rose-600/40 relative z-10"
                    spellCheck={false}
                  />
                </div>

                {/* Editor Footer Action */}
                <div className="px-5 py-3.5 bg-neutral-900/90 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">
                    Target: <strong className="text-white">{selectedProblem.timeComplexity}</strong>
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={handleRunCode}
                    disabled={testRun.isRunning}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{testRun.isRunning ? 'Executing...' : 'Run Tests & Preview UI'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MODE 2: MOBBIN PRODUCTION UI ARCHITECTURE */}
        {questionMode === 'mobbin-ui' && (
          <motion.div
            key="mobbin-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-6"
          >
            {/* Top Bar: Flow Selector & Mobbin Verified Badge */}
            <div className="oled-panel rounded-2xl p-6 border border-white/10 bg-neutral-950/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold font-mono">
                    Official Mobbin Screen Flow
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    Pattern: {selectedUiChallenge.patternType}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                  {selectedUiChallenge.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  {selectedUiChallenge.userStory}
                </p>
              </div>

              {/* Challenge Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-500 font-mono">Flow:</span>
                <select
                  value={selectedUiChallenge.id}
                  onChange={(e) => {
                    const found = UI_CHALLENGES.find(c => c.id === e.target.value);
                    if (found) {
                      setSelectedUiChallenge(found);
                      setMobbinQuizAnswer(null);
                      setMobbinQuizSubmitted(false);
                    }
                  }}
                  className="bg-neutral-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                >
                  {UI_CHALLENGES.map(c => (
                    <option key={c.id} value={c.id}>{c.company} — {c.patternType}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveUiSection('hierarchy')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition flex items-center space-x-2 ${
                  activeUiSection === 'hierarchy' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Component Hierarchy</span>
              </button>

              <button
                onClick={() => setActiveUiSection('state')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition flex items-center space-x-2 ${
                  activeUiSection === 'state' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>State Boundaries</span>
              </button>

              <button
                onClick={() => setActiveUiSection('edge-cases')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition flex items-center space-x-2 ${
                  activeUiSection === 'edge-cases' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Defensive Edge-Cases</span>
              </button>

              <button
                onClick={() => setActiveUiSection('quiz')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition flex items-center space-x-2 ${
                  activeUiSection === 'quiz' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobbin Architecture Quiz</span>
              </button>
            </div>

            {/* Section 1: Component Tree */}
            {activeUiSection === 'hierarchy' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUiChallenge.recommendedComponentTree.map((comp) => (
                  <div key={comp.id} className="oled-panel rounded-2xl p-5 border border-white/10 bg-neutral-950/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">
                        &lt;{comp.name} /&gt;
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                        {comp.type}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{comp.description}</p>
                    
                    {comp.stateUsed && comp.stateUsed.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">State Subscriptions:</span>
                        <div className="flex flex-wrap gap-1">
                          {comp.stateUsed.map((s, i) => (
                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Section 2: State Boundaries */}
            {activeUiSection === 'state' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="oled-panel rounded-2xl p-5 border border-white/10 bg-neutral-950/70 space-y-3">
                  <h4 className="font-bold text-white text-xs font-mono uppercase text-sky-400">1. Local Component State</h4>
                  <ul className="text-xs text-neutral-300 space-y-2">
                    {selectedUiChallenge.stateArchitectureGuide.localState.map((st, i) => (
                      <li key={i} className="font-mono text-[11px] bg-white/5 p-2 rounded-lg leading-relaxed">• {st}</li>
                    ))}
                  </ul>
                </div>

                <div className="oled-panel rounded-2xl p-5 border border-white/10 bg-neutral-950/70 space-y-3">
                  <h4 className="font-bold text-white text-xs font-mono uppercase text-rose-400">2. Global Store (Zustand/Redux)</h4>
                  <ul className="text-xs text-neutral-300 space-y-2">
                    {selectedUiChallenge.stateArchitectureGuide.globalState.map((st, i) => (
                      <li key={i} className="font-mono text-[11px] bg-white/5 p-2 rounded-lg leading-relaxed">• {st}</li>
                    ))}
                  </ul>
                </div>

                <div className="oled-panel rounded-2xl p-5 border border-white/10 bg-neutral-950/70 space-y-3">
                  <h4 className="font-bold text-white text-xs font-mono uppercase text-emerald-400">3. Server Cache (TanStack Query)</h4>
                  <ul className="text-xs text-neutral-300 space-y-2">
                    {selectedUiChallenge.stateArchitectureGuide.serverCacheState.map((st, i) => (
                      <li key={i} className="font-mono text-[11px] bg-white/5 p-2 rounded-lg leading-relaxed">• {st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 3: Defensive Edge Cases */}
            {activeUiSection === 'edge-cases' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUiChallenge.edgeCases.map((ec, i) => (
                  <div key={i} className="oled-panel rounded-2xl p-5 border border-white/10 bg-neutral-950/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{ec.scenario}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                        {ec.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 font-mono leading-relaxed bg-black/60 p-3 rounded-xl border border-white/5">
                      <strong className="text-rose-400 block mb-0.5">Defensive Strategy:</strong>
                      {ec.expectedBehavior}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Section 4: Mobbin Quiz */}
            {activeUiSection === 'quiz' && (
              <div className="max-w-2xl mx-auto oled-panel rounded-3xl p-8 border border-white/10 space-y-6">
                {selectedUiChallenge.interactiveQuiz && selectedUiChallenge.interactiveQuiz.length > 0 ? (
                  (() => {
                    const quiz = selectedUiChallenge.interactiveQuiz[0];
                    return (
                      <div className="space-y-4">
                        <span className="text-xs font-mono text-rose-400 font-bold uppercase">
                          Mobbin Design Pattern Validation
                        </span>
                        <h4 className="text-base font-bold text-white leading-relaxed">{quiz.question}</h4>

                        <div className="space-y-2.5 pt-2">
                          {quiz.options.map((opt, i) => {
                            const isSelected = mobbinQuizAnswer === i;
                            const isCorrect = quiz.correctIndex === i;
                            let style = 'bg-neutral-900 border-white/10 text-neutral-200 hover:border-white/20';
                            if (mobbinQuizSubmitted) {
                              if (isCorrect) style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                              else if (isSelected && !isCorrect) style = 'bg-rose-950/40 border-rose-500 text-rose-200';
                            } else if (isSelected) {
                              style = 'bg-rose-600/20 border-rose-500 text-white font-semibold';
                            }

                            return (
                              <div
                                key={i}
                                onClick={() => !mobbinQuizSubmitted && setMobbinQuizAnswer(i)}
                                className={`p-4 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${style}`}
                              >
                                <span>{opt}</span>
                                {mobbinQuizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                              </div>
                            );
                          })}
                        </div>

                        {mobbinQuizSubmitted && (
                          <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300 leading-relaxed font-mono">
                            <strong className="text-rose-400 block mb-1">Architecture Insight:</strong>
                            {quiz.explanation}
                          </div>
                        )}

                        <div className="pt-2">
                          {!mobbinQuizSubmitted ? (
                            <button
                              onClick={() => mobbinQuizAnswer !== null && setMobbinQuizSubmitted(true)}
                              disabled={mobbinQuizAnswer === null}
                              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition"
                            >
                              Verify UI Architecture
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setMobbinQuizAnswer(null);
                                setMobbinQuizSubmitted(false);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                            >
                              Reset Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-neutral-400 font-mono">No quiz available for this flow.</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* MODE 3: ARCHITECTURE & INVARIANT MCQ */}
        {questionMode === 'mcq' && (
          <motion.div
            key="mcq-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="max-w-3xl mx-auto oled-panel rounded-3xl p-8 border border-white/10 space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-rose-400 uppercase font-bold tracking-wider">
                Question {currentMcqIndex + 1} of {mcqList.length}
              </span>
              <span className="text-xs text-neutral-400 font-mono">Engineering Reasoning</span>
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
                    <span>{opt}</span>
                    {mcqSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {mcqSubmitted && (
              <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-300 leading-relaxed font-mono">
                <strong className="text-rose-400 block mb-1">Architectural Insight:</strong>
                {currentMcq.explanation}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between">
              {!mcqSubmitted ? (
                <button
                  onClick={() => selectedMcqAnswer !== null && setMcqSubmitted(true)}
                  disabled={selectedMcqAnswer === null}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition"
                >
                  Verify Answer
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentMcqIndex(prev => (prev + 1) % mcqList.length);
                    setSelectedMcqAnswer(null);
                    setMcqSubmitted(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                >
                  Next Architecture MCQ
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* MODE 4: SYSTEM REASONING & DEFENSE */}
        {questionMode === 'system-reasoning' && (
          <motion.div
            key="reasoning-mode"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="max-w-3xl mx-auto oled-panel rounded-3xl p-8 border border-white/10 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-rose-400 uppercase font-bold tracking-wider">
                  System Reasoning & Defense
                </span>
                <h3 className="text-base font-bold text-white mt-1 leading-relaxed">
                  {reasoningPrompt}
                </h3>
              </div>

              {/* Evaluator Engine Switcher: Gemini vs Anakin */}
              <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono flex-shrink-0">
                <button
                  onClick={() => setEvaluatorEngine('gemini')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    evaluatorEngine === 'gemini' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Gemini
                </button>
                <button
                  onClick={() => setEvaluatorEngine('anakin')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    evaluatorEngine === 'anakin' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Anakin.ai
                </button>
              </div>
            </div>

            <textarea
              value={reasoningAnswer}
              onChange={(e) => setReasoningAnswer(e.target.value)}
              placeholder="Outline your invariants, retry semantics, mutex boundaries, and storage choices..."
              className="w-full h-44 bg-black border border-white/15 rounded-2xl p-4 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition leading-relaxed"
            />

            {reasoningFeedback && (
              <div className="p-4 rounded-2xl bg-neutral-900 border border-rose-500/30 text-xs text-neutral-200 space-y-1">
                <span className="text-rose-400 font-bold block font-mono">Principal Evaluation:</span>
                <p className="leading-relaxed">{reasoningFeedback}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">Evaluated against {track.company} senior invariants</span>
              <button
                onClick={handleEvaluateReasoning}
                disabled={!reasoningAnswer.trim() || isEvaluatingReasoning}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition"
              >
                {isEvaluatingReasoning ? 'Grading...' : 'Submit Defense to AI'}
              </button>
            </div>
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
      />

      <RaiseHandModal
        isOpen={isRaiseHandOpen}
        onClose={() => setIsRaiseHandOpen(false)}
        problem={selectedProblem}
        clarifyingQuestions={clarifyingQuestions}
        onAddQuestion={(q) => setClarifyingQuestions(prev => [...prev, q])}
      />

    </div>
  );
};
