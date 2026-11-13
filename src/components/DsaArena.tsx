import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  Video, 
  Lock, 
  Unlock, 
  Clock, 
  Sparkles, 
  RotateCcw, 
  XCircle, 
  Check, 
  Zap, 
  Repeat,
  Volume2,
  VolumeX,
  PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DSA_PROBLEMS } from '../data/dsaProblems';
import { DsaProblem, InterviewClarifyingQuestion } from '../types';
import { ScrimbaPlayer } from './ScrimbaPlayer';
import { InterviewTimer } from './InterviewTimer';
import { RaiseHandModal } from './RaiseHandModal';
import { executeCodeStrict, ExecutionOutcome } from '../services/codeExecutionService';
import { voiceService } from '../services/voiceService';
import { TypingSparksOverlay } from './TypingSparksOverlay';

interface DsaArenaProps {
  onSolveProblem: (problemId: string) => void;
  solvedProblemIds: string[];
  onTriggerAiPrompt?: (prompt: string) => void;
  customProblems?: DsaProblem[];
  onOpenCalibration?: () => void;
  onUpdateExecutionOutcome?: (outcome: ExecutionOutcome, hintsUnlocked: number, clarifyingCount: number) => void;
}

export const DsaArena: React.FC<DsaArenaProps> = ({ 
  onSolveProblem, 
  solvedProblemIds,
  onTriggerAiPrompt,
  customProblems = [],
  onOpenCalibration,
  onUpdateExecutionOutcome
}) => {
  const allProblems = customProblems.length > 0 
    ? [...customProblems, ...DSA_PROBLEMS.filter(p => !customProblems.some(cp => cp.id === p.id))]
    : DSA_PROBLEMS;

  const [selectedProblem, setSelectedProblem] = useState<DsaProblem>(allProblems[0]);
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState<string>(selectedProblem.starterCode.javascript);
  
  // 3D Holo-Deck Flip state: false = Code Editor, true = Spatial Solution Player
  const [isFlipped, setIsFlipped] = useState(false);

  // Focus Dimming state: true for 1.5 seconds after unlocking a vault
  const [isFocusDimmed, setIsFocusDimmed] = useState(false);
  const [activeVaultNotification, setActiveVaultNotification] = useState<string | null>(null);

  // Vault Unlocked Counts per problem
  const [unlockedVaults, setUnlockedVaults] = useState<{ [problemId: string]: number }>({
    [selectedProblem.id]: 0
  });

  // Highlight-to-ask state
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Voice speech state
  const [isSpeakingDescription, setIsSpeakingDescription] = useState(false);
  const [speakingVaultId, setSpeakingVaultId] = useState<number | null>(null);

  // "Raise Hand" Clarifying Questions state
  const [isRaiseHandOpen, setIsRaiseHandOpen] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<InterviewClarifyingQuestion[]>([]);

  // Real Test Results State
  const [testRun, setTestRun] = useState<{
    isRunning: boolean;
    hasRun: boolean;
    outcome: ExecutionOutcome | null;
  }>({
    isRunning: false,
    hasRun: false,
    outcome: null
  });

  // Synchronize when custom problem arrives
  useEffect(() => {
    if (customProblems.length > 0 && selectedProblem.id !== customProblems[0].id) {
      setSelectedProblem(customProblems[0]);
      setCode(customProblems[0].starterCode[language]);
    }
  }, [customProblems]);

  // Handle problem change
  const handleSelectProblem = (problem: DsaProblem) => {
    voiceService.stopSpeaking();
    setIsSpeakingDescription(false);
    setSelectedProblem(problem);
    setCode(problem.starterCode[language]);
    setIsFlipped(false);
    setTestRun({ isRunning: false, hasRun: false, outcome: null });
  };

  // Handle language switch
  const handleLanguageChange = (lang: 'javascript' | 'python') => {
    setLanguage(lang);
    setCode(selectedProblem.starterCode[lang]);
    setTestRun({ isRunning: false, hasRun: false, outcome: null });
  };

  // Vault Unlock Action with spring physics & Focus Dimming
  const currentUnlockedCount = unlockedVaults[selectedProblem.id] || 0;

  const unlockVault = (vaultIndex: number) => {
    if (vaultIndex === currentUnlockedCount && currentUnlockedCount < selectedProblem.hints.length) {
      setUnlockedVaults(prev => ({
        ...prev,
        [selectedProblem.id]: currentUnlockedCount + 1
      }));

      // Trigger Focus Dimming on code editor for 1.5s
      setIsFocusDimmed(true);
      setActiveVaultNotification(`Vault ${vaultIndex + 1} Unlocked: Take 10 seconds to internalize this hint before writing code.`);
      setTimeout(() => {
        setIsFocusDimmed(false);
        setActiveVaultNotification(null);
      }, 1500);
    }
  };

  const resetVaults = () => {
    setUnlockedVaults(prev => ({
      ...prev,
      [selectedProblem.id]: 0
    }));
  };

  // Text selection listener for Highlight-to-Ask
  const handleTextSelect = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      if (start !== end) {
        const text = code.substring(start, end).trim();
        if (text.length > 2) {
          setSelectedText(text);
          setSelectionPosition({ x: 220, y: 70 });
          return;
        }
      }
    }
    setSelectedText('');
    setSelectionPosition(null);
  };

  // Real in-browser JavaScript & Python evaluation engine
  const handleRunCode = async () => {
    setTestRun({ isRunning: true, hasRun: false, outcome: null });
    
    // Strict execution against real test cases
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

    onUpdateExecutionOutcome?.(outcome, currentUnlockedCount, clarifyingQuestions.length);

    if (outcome.allPassed) {
      try {
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const handleSubmitSolution = async () => {
    await handleRunCode();
    if (testRun.outcome?.allPassed) {
      onSolveProblem(selectedProblem.id);
    }
  };

  // Voice narration helpers
  const handleToggleDescriptionVoice = () => {
    if (isSpeakingDescription) {
      voiceService.stopSpeaking();
      setIsSpeakingDescription(false);
    } else {
      setIsSpeakingDescription(true);
      voiceService.speak(`${selectedProblem.title}. ${selectedProblem.description}`, {
        onEnd: () => setIsSpeakingDescription(false),
        onError: () => setIsSpeakingDescription(false)
      });
    }
  };

  const handleToggleVaultVoice = (vaultId: number, content: string) => {
    if (speakingVaultId === vaultId) {
      voiceService.stopSpeaking();
      setSpeakingVaultId(null);
    } else {
      setSpeakingVaultId(vaultId);
      voiceService.speak(content, {
        onEnd: () => setSpeakingVaultId(null),
        onError: () => setSpeakingVaultId(null)
      });
    }
  };

  const isSolved = solvedProblemIds.includes(selectedProblem.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Strip: Curriculum Switcher + Interview Timer + Raise Hand */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
        
        {/* Challenge Selection Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">Challenges:</span>
          {allProblems.map((problem) => {
            const solved = solvedProblemIds.includes(problem.id);
            const active = problem.id === selectedProblem.id;
            return (
              <button
                key={problem.id}
                onClick={() => handleSelectProblem(problem)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  active
                    ? 'bg-rose-600/20 text-rose-300 border-rose-500 shadow-md shadow-rose-600/10'
                    : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/15 hover:text-white'
                }`}
              >
                {solved && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="max-w-[150px] truncate">{problem.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {problem.difficulty}
                </span>
              </button>
            );
          })}

          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
              title="Generate tailored problem for your dream company"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Calibrate New Challenge</span>
            </button>
          )}
        </div>

        {/* Live Interview Screen Timer */}
        <div className="flex items-center space-x-3">
          <InterviewTimer initialMinutes={45} />
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Problem Overview & Anti-Spoiler Vaults (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Problem Specs Card */}
          <div className="oled-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                  {selectedProblem.category}
                </span>
                {isSolved && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Solved</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleDescriptionVoice}
                  className={`p-1.5 rounded-lg border text-xs transition ${
                    isSpeakingDescription 
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-white/5'
                  }`}
                  title={isSpeakingDescription ? "Stop voice readout" : "Read problem aloud (TTS)"}
                >
                  {isSpeakingDescription ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center space-x-1 text-xs text-neutral-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedProblem.timeComplexity}</span>
                </div>
              </div>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">{selectedProblem.title}</h1>
            
            <div className="flex flex-wrap gap-1.5">
              {selectedProblem.companyTags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-white/5 font-mono">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
              {selectedProblem.description}
            </p>

            {/* Constraints */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">Constraints:</h3>
              <ul className="text-xs text-neutral-400 space-y-1 list-disc pl-4 font-mono">
                {selectedProblem.constraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Examples:</h3>
              {selectedProblem.examples.map((ex, idx) => (
                <div key={idx} className="bg-neutral-950/80 rounded-xl p-3 border border-white/5 text-xs font-mono space-y-1">
                  <div><span className="text-neutral-500">Input:</span> <span className="text-sky-300">{ex.input}</span></div>
                  <div><span className="text-neutral-500">Output:</span> <span className="text-emerald-300">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="text-neutral-400 text-[11px] font-sans pt-1 border-t border-white/5">
                      💡 {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Spoiler Vault Hint System */}
          <div className="oled-panel rounded-2xl p-6 border border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">The "Vault" Hint System</h3>
                  <p className="text-[11px] text-sky-300/80">Progressive Anti-Spoiler Pedagogy</p>
                </div>
              </div>

              {currentUnlockedCount > 0 && (
                <button 
                  onClick={resetVaults}
                  className="flex items-center space-x-1 text-[11px] text-neutral-400 hover:text-white transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Lock All</span>
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Hover to preview the meta-clue. Click to shatter the lock with spring-physics.
            </p>

            {/* 3 Vault Cards */}
            <div className="space-y-3">
              {selectedProblem.hints.map((hint, idx) => {
                const isUnlocked = idx < currentUnlockedCount;
                const isNextToUnlock = idx === currentUnlockedCount;
                const isSpeakingThisVault = speakingVaultId === hint.id;

                return (
                  <motion.div
                    key={hint.id}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isUnlocked 
                        ? 'bg-neutral-900/90 border-sky-500/40 p-4' 
                        : isNextToUnlock 
                          ? 'bg-neutral-950 border-white/15 p-3 hover:border-sky-500/40 cursor-pointer group' 
                          : 'bg-neutral-950/40 border-white/5 p-3 opacity-40 cursor-not-allowed'
                    }`}
                    onClick={() => isNextToUnlock && unlockVault(idx)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {isUnlocked ? (
                          <motion.div initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
                            <Unlock className="w-4 h-4 text-sky-400" />
                          </motion.div>
                        ) : (
                          <Lock className="w-4 h-4 text-neutral-500 group-hover:text-sky-400 transition" />
                        )}
                        <span className="text-xs font-bold text-white">{hint.title}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isUnlocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVaultVoice(hint.id, hint.content);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition"
                            title="Hear hint spoken aloud"
                          >
                            {isSpeakingThisVault ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-mono">
                          Vault {idx + 1}
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-neutral-300 leading-relaxed mt-2 pt-2 border-t border-white/10"
                      >
                        {hint.content}
                      </motion.p>
                    ) : (
                      <div className="text-[11px] text-neutral-400 group-hover:text-sky-300 transition mt-1 italic">
                        {hint.metaClue}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: 3D Holo-Deck Panel (Editor Front, Spatial Solution Back) */}
        <div className="lg:col-span-7 perspective-1000">
          
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            className="transform-style-3d relative w-full"
          >
            
            {/* FRONT FACE: Code Editor & Test Suite */}
            <div className={`oled-panel rounded-2xl border border-white/10 flex flex-col backface-hidden ${
              isFlipped ? 'pointer-events-none' : ''
            } ${testRun.hasRun && testRun.outcome?.allPassed ? 'glow-emerald border-emerald-500/60' : ''} ${
              testRun.isRunning ? 'compiling-overdrive' : ''
            }`}>
              
              {/* Editor Top Bar with Raise Hand & 3D Flip Trigger */}
              <div className="bg-neutral-900/90 px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-neutral-400">solution.{language === 'javascript' ? 'js' : 'py'}</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  {/* Language switch */}
                  <div className="flex items-center space-x-1 bg-black p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => handleLanguageChange('javascript')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        language === 'javascript' ? 'bg-white/15 text-white font-bold' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      JS
                    </button>
                    <button
                      onClick={() => handleLanguageChange('python')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        language === 'python' ? 'bg-white/15 text-white font-bold' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      PY
                    </button>
                  </div>

                  {/* "Raise Hand" (✋) Clarifying Questions Button */}
                  <button
                    onClick={() => setIsRaiseHandOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/15 text-rose-300 hover:bg-rose-600/25 border border-rose-500/30 transition shadow-sm"
                    title="Ask the interviewer a clarifying question"
                  >
                    <span>✋</span>
                    <span>Raise Hand</span>
                    {clarifyingQuestions.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {clarifyingQuestions.length}
                      </span>
                    )}
                  </button>

                  {/* 3D Holo-Deck Flip Button */}
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/30 transition shadow-sm"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Holo-Deck Explainer</span>
                  </button>
                </div>
              </div>

              {/* Focus Dimming Overlay notification */}
              {activeVaultNotification && (
                <div className="bg-sky-950/80 border-b border-sky-500/30 px-4 py-2 text-xs text-sky-200 flex items-center space-x-2 animate-in fade-in">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{activeVaultNotification}</span>
                </div>
              )}

              {/* Text Area Code Editor with Focus Dimming and Kinetic Typing Sparks */}
              <div className={`relative min-h-[360px] bg-black p-4 transition-opacity duration-300 ${
                isFocusDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'
              }`}>
                {/* 1-Pixel Tactile Typing Sparks */}
                <TypingSparksOverlay textareaRef={editorRef} />

                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onSelect={handleTextSelect}
                  className="w-full h-full min-h-[340px] bg-transparent text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-rose-600/40 relative z-10"
                  spellCheck={false}
                />

                {/* Highlight-to-Ask Contextual AI Popover */}
                {selectedText && selectionPosition && onTriggerAiPrompt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute z-30 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xl cursor-pointer hover:bg-rose-500 transition"
                    style={{ top: selectionPosition.y, left: selectionPosition.x }}
                    onClick={() => {
                      onTriggerAiPrompt(`Evaluate this code snippet from my solution: "${selectedText}". What is its time complexity and are there edge cases?`);
                      setSelectedText('');
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI about highlighted code</span>
                  </motion.div>
                )}
              </div>

              {/* Strict Real Test Suite Output with RGB Glitch Error Interventions */}
              {testRun.hasRun && testRun.outcome && (
                <div className={`p-4 border-t border-white/10 bg-neutral-950 text-xs font-mono space-y-3 ${
                  !testRun.outcome.allPassed ? 'glitch-error' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {testRun.outcome.allPassed ? (
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>All Automated Test Cases Passed!</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                          <XCircle className="w-4 h-4" />
                          <span>Test Failure Detected (Edge Case Missed)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-neutral-400 text-[11px]">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{testRun.outcome.executionTimeMs}ms execution</span>
                    </div>
                  </div>

                  {testRun.outcome.error ? (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                      ⚠️ {testRun.outcome.error}
                    </div>
                  ) : null}

                  {testRun.outcome.tests.length > 0 && (
                    <div className="space-y-2">
                      {testRun.outcome.tests.map((t, idx) => (
                        <div 
                          key={idx} 
                          className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                            t.passed 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {t.passed ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                            <span className="font-semibold">{t.title}</span>
                          </div>
                          <div className="text-neutral-400 space-x-2 font-mono text-[10px]">
                            <span>Expected: <span className="text-white">{t.expected}</span></span>
                            <span>Got: <span className={t.passed ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>{t.actual}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons with 0.95 Click Physics */}
              <div className="bg-neutral-900/90 px-5 py-3.5 border-t border-white/10 flex items-center justify-between">
                <div className="text-[11px] text-neutral-400 font-mono">
                  Target: <span className="text-neutral-200">{selectedProblem.timeComplexity}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={handleRunCode}
                    disabled={testRun.isRunning}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition border border-white/10 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>{testRun.isRunning ? 'Executing...' : 'Run Tests'}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={handleSubmitSolution}
                    disabled={testRun.isRunning}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Submit & Unlock</span>
                  </motion.button>
                </div>
              </div>

            </div>

            {/* BACK FACE: Spatial Solution Player */}
            <div className={`oled-panel rounded-2xl border border-pink-500/30 flex flex-col absolute inset-0 backface-hidden rotate-y-180 bg-black ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}>
              {/* Back Face Header */}
              <div className="bg-neutral-900/95 px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-pink-400 font-bold">
                  <Video className="w-4 h-4" />
                  <span>Spatial Codecast Explainer</span>
                </div>

                <button
                  onClick={() => setIsFlipped(false)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Flip back to Editor</span>
                </button>
              </div>

              {/* Interactive Player */}
              <div className="p-4 flex-1 overflow-y-auto">
                <ScrimbaPlayer problem={selectedProblem} />
              </div>
            </div>

          </motion.div>

        </div>

      </div>

      {/* "Raise Hand" Clarifying Questions Modal */}
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
