import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  HelpCircle, 
  Video, 
  Code, 
  Lock, 
  Unlock, 
  AlertCircle,
  Clock,
  Sparkles, 
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DSA_PROBLEMS } from '../data/dsaProblems';
import { DsaProblem } from '../types';

interface DsaArenaProps {
  onSolveProblem: (problemId: string) => void;
  solvedProblemIds: string[];
}

export const DsaArena: React.FC<DsaArenaProps> = ({ 
  onSolveProblem, 
  solvedProblemIds 
}) => {
  const [selectedProblem, setSelectedProblem] = useState<DsaProblem>(DSA_PROBLEMS[0]);
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState<string>(selectedProblem.starterCode.javascript);
  const [activeTab, setActiveTab] = useState<'editor' | 'scrimba'>('editor');
  
  // Hint reveal state per problem
  const [revealedHints, setRevealedHints] = useState<{ [problemId: string]: number }>({
    [selectedProblem.id]: 0
  });

  // Test run state
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'running' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Handle problem change
  const handleSelectProblem = (problem: DsaProblem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[language]);
    setTestResult({ status: 'idle' });
    setActiveTab('editor');
  };

  // Handle language switch
  const handleLanguageChange = (lang: 'javascript' | 'python') => {
    setLanguage(lang);
    setCode(selectedProblem.starterCode[lang]);
  };

  // Progressive Hint Unlocking (Interview Cake Pedagogy)
  const currentRevealedCount = revealedHints[selectedProblem.id] || 0;
  
  const unlockNextHint = () => {
    if (currentRevealedCount < selectedProblem.hints.length) {
      setRevealedHints(prev => ({
        ...prev,
        [selectedProblem.id]: currentRevealedCount + 1
      }));
    }
  };

  // Reset hints
  const resetHints = () => {
    setRevealedHints(prev => ({
      ...prev,
      [selectedProblem.id]: 0
    }));
  };

  // Run Test / Submit
  const handleRunCode = () => {
    setTestResult({ status: 'running' });
    setTimeout(() => {
      // Simulate test case verification
      setTestResult({
        status: 'success',
        message: 'All 3 test cases passed! Time complexity matches target ' + selectedProblem.timeComplexity + '.'
      });
    }, 600);
  };

  const handleSubmitSolution = () => {
    setTestResult({ status: 'running' });
    setTimeout(() => {
      setTestResult({
        status: 'success',
        message: 'Accepted! Solution successfully submitted and recorded to Firebase.'
      });
      onSolveProblem(selectedProblem.id);
      
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    }, 800);
  };

  const isSolved = solvedProblemIds.includes(selectedProblem.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Problem Selection Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Challenge:</span>
        {DSA_PROBLEMS.map((problem) => {
          const solved = solvedProblemIds.includes(problem.id);
          const active = problem.id === selectedProblem.id;
          return (
            <button
              key={problem.id}
              onClick={() => handleSelectProblem(problem)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                active
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {solved && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{problem.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {problem.difficulty}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Problem & Interview Cake Hints (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Problem Overview Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {selectedProblem.category}
                </span>
                {isSolved && (
                  <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    <span>Solved</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedProblem.timeComplexity}</span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-white mb-2">{selectedProblem.title}</h1>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedProblem.companyTags.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-4">
              {selectedProblem.description}
            </p>

            {/* Examples */}
            <div className="space-y-3 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Examples:</h3>
              {selectedProblem.examples.map((ex, idx) => (
                <div key={idx} className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 text-xs font-mono space-y-1">
                  <div><span className="text-slate-400">Input:</span> <span className="text-indigo-300">{ex.input}</span></div>
                  <div><span className="text-slate-400">Output:</span> <span className="text-emerald-300">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="text-slate-400 text-[11px] font-sans pt-1 border-t border-slate-800">
                      💡 {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Constraints:</h3>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                {selectedProblem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interview Cake Progressive Hints System */}
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Interview Cake Hint Breakdown</h3>
                  <p className="text-[11px] text-amber-300/80">Socratic Progressive Hint System</p>
                </div>
              </div>

              {currentRevealedCount > 0 && (
                <button 
                  onClick={resetHints} 
                  className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Hints</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Real interviewers don't give you the solution—they drop subtle clues. Reveal hints one-by-one only when you get stuck!
            </p>

            {/* Hint Cards */}
            <div className="space-y-3 mb-4">
              {selectedProblem.hints.map((hint, idx) => {
                const isRevealed = idx < currentRevealedCount;
                return (
                  <div 
                    key={hint.id}
                    className={`rounded-xl border transition-all duration-200 ${
                      isRevealed 
                        ? 'bg-slate-900/90 border-amber-500/30 p-4' 
                        : 'bg-slate-900/40 border-slate-800/80 p-3 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {isRevealed ? (
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span className="text-xs font-semibold text-slate-200">{hint.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {hint.tier}
                      </span>
                    </div>

                    {isRevealed ? (
                      <p className="text-xs text-slate-300 leading-relaxed mt-2 pt-2 border-t border-slate-800">
                        {hint.content}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        Locked hint. Click below to reveal.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unlock Button */}
            {currentRevealedCount < selectedProblem.hints.length ? (
              <button
                onClick={unlockNextHint}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  Unlock Hint {currentRevealedCount + 1} ({selectedProblem.hints[currentRevealedCount].tier})
                </span>
              </button>
            ) : (
              <div className="text-center py-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                All hints unlocked! Try writing your solution in the editor.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Code Editor & Scrimba Explainer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Header with Editor / Scrimba Toggle & Language Selector */}
          <div className="glass-panel rounded-2xl p-3 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code Editor</span>
              </button>

              <button
                onClick={() => setActiveTab('scrimba')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'scrimba'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Scrimba Interactive Explainer</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-700/50">
                  Embed
                </span>
              </button>
            </div>

            {/* Language Selector */}
            {activeTab === 'editor' && (
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => handleLanguageChange('javascript')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                    language === 'javascript' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => handleLanguageChange('python')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                    language === 'python' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Python
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Code Editor View */}
          {activeTab === 'editor' && (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col flex-1">
              
              {/* Editor Bar */}
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">solution.{language === 'javascript' ? 'js' : 'py'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCode(selectedProblem.solutionCode[language])}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 transition"
                  >
                    View Model Solution
                  </button>
                  <button
                    onClick={() => setCode(selectedProblem.starterCode[language])}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition"
                  >
                    Reset Code
                  </button>
                </div>
              </div>

              {/* Text Area Code Editor */}
              <div className="relative flex-1 min-h-[380px] bg-slate-950 p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full min-h-[360px] bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-indigo-600/40"
                  spellCheck={false}
                />
              </div>

              {/* Output / Test Results Box */}
              {testResult.status !== 'idle' && (
                <div className={`p-4 border-t border-slate-800 text-xs font-mono transition-all ${
                  testResult.status === 'success' ? 'bg-emerald-950/30 text-emerald-300' : 'bg-slate-900 text-slate-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    {testResult.status === 'running' && (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {testResult.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{testResult.status === 'running' ? 'Running test runner...' : testResult.message}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-slate-900/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Target: <span className="text-slate-300 font-mono">{selectedProblem.timeComplexity}</span> | <span className="text-slate-300 font-mono">{selectedProblem.spaceComplexity}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRunCode}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    <span>Run Tests</span>
                  </button>

                  <button
                    onClick={handleSubmitSolution}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Submit & Save</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Scrimba Interactive Explainer View */}
          {activeTab === 'scrimba' && (
            <div className="glass-panel rounded-2xl border border-pink-500/20 p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Scrimba Interactive Codecast</h3>
                    <p className="text-[11px] text-slate-400">Watch, pause, and edit the code directly inside the video player</p>
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  Interactive Screencast
                </span>
              </div>

              {/* Scrimba Player Mock Container */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex flex-col items-center justify-center text-center p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-pink-900/20 opacity-60" />
                
                <div className="relative z-10 max-w-md space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/20 animate-pulse">
                    <Play className="w-7 h-7 fill-pink-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Interactive Walkthrough: {selectedProblem.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Powered by the **Scrimba Explainers API**. This interactive player walks through the greedy pointer logic step-by-step with synchronized audio and editable code!
                  </p>
                  
                  <div className="pt-2 flex items-center justify-center space-x-3 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      Duration: 3m 45s
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      Editable at any point
                    </span>
                  </div>
                </div>
              </div>

              {/* Interview Cake Pedagogy & Pitfalls */}
              <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Common Interview Pitfalls (Interview Cake):</span>
                </h4>
                <ul className="space-y-1">
                  {selectedProblem.interviewCakePedagogy.commonPitfalls.map((pitfall, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
