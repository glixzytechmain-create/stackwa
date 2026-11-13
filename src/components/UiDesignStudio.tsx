import React, { useState } from 'react';
import { 
  CheckCircle, 
  Sparkles, 
  Eye, 
  Database, 
  Terminal, 
  Search, 
  FolderTree, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UI_CHALLENGES } from '../data/uiFlows';
import { UiDesignChallenge } from '../types';

interface UiDesignStudioProps {
  onCompleteFlow: (flowId: string) => void;
  completedFlowIds: string[];
}

export const UiDesignStudio: React.FC<UiDesignStudioProps> = ({ 
  onCompleteFlow, 
  completedFlowIds 
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<UiDesignChallenge>(UI_CHALLENGES[0]);
  const [checkedEdgeCases, setCheckedEdgeCases] = useState<{ [key: string]: boolean }>({});
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [quizIndex: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleSelectChallenge = (challenge: UiDesignChallenge) => {
    setSelectedChallenge(challenge);
    setCheckedEdgeCases({});
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
  };

  const toggleEdgeCase = (index: number) => {
    const key = `${selectedChallenge.id}-${index}`;
    setCheckedEdgeCases(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAnswer = (qIndex: number, aIndex: number) => {
    if (quizSubmitted) return;
    setSelectedQuizAnswers(prev => ({
      ...prev,
      [qIndex]: aIndex
    }));
  };

  const handleCheckQuiz = () => {
    setQuizSubmitted(true);
    const allCorrect = selectedChallenge.interactiveQuiz.every(
      (q, idx) => selectedQuizAnswers[idx] === q.correctIndex
    );
    if (allCorrect) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const handleCompleteChallenge = () => {
    onCompleteFlow(selectedChallenge.id);
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {}
  };

  const isCompleted = completedFlowIds.includes(selectedChallenge.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Challenge Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobbin Pattern:</span>
        {UI_CHALLENGES.map((challenge) => {
          const completed = completedFlowIds.includes(challenge.id);
          const active = challenge.id === selectedChallenge.id;
          return (
            <button
              key={challenge.id}
              onClick={() => handleSelectChallenge(challenge)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                active
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500 shadow-md shadow-purple-500/10'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {completed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{challenge.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {challenge.patternType}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Mobbin Screen & Architecture Breakdown (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Header Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                  {selectedChallenge.company}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedChallenge.patternType}
                </span>
                {isCompleted && (
                  <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    <span>Mastered</span>
                  </span>
                )}
              </div>

              <a 
                href="https://mobbin.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center space-x-1 text-[11px] text-purple-400 hover:text-purple-300 transition"
              >
                <span>Mobbin Design Benchmark</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h1 className="text-xl font-bold text-white mb-2">{selectedChallenge.title}</h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedChallenge.appContext}
            </p>

            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-xs space-y-1.5">
              <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">User Story:</span>
              <p className="text-slate-300 italic">{selectedChallenge.userStory}</p>
            </div>
          </div>

          {/* Simulated UI Screen Mockup Card */}
          <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Production UI Flow Simulation</h3>
              </div>
              <span className="text-[10px] text-slate-400">Curated from Mobbin UI Flows</span>
            </div>

            {/* Interactive Mockup Preview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-indigo-900/10" />

              {/* Linear Simulation */}
              {selectedChallenge.id === 'linear-command-palette' && (
                <div className="relative z-10 w-full max-w-sm bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center px-3 py-2.5 border-b border-slate-800 space-x-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Type a command or search issues..." 
                      className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                      defaultValue="create issue"
                    />
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">ESC</kbd>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Actions</div>
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs text-white">
                      <div className="flex items-center space-x-2">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Create new issue</span>
                      </div>
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">C</kbd>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800/50">
                      <div className="flex items-center space-x-2">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        <span>Search docs and shortcuts</span>
                      </div>
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">?</kbd>
                    </div>
                  </div>
                </div>
              )}

              {/* Airbnb Simulation */}
              {selectedChallenge.id === 'airbnb-filter-drawer' && (
                <div className="relative z-10 w-full max-w-sm bg-slate-900 rounded-xl border border-slate-700 shadow-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white">Filters</h4>
                    <span className="text-[10px] text-slate-400">Clear all</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-300">Price range</div>
                    <div className="h-10 bg-slate-800/60 rounded-lg flex items-center justify-around px-2 text-[10px] text-slate-400">
                      <span>$50 min</span>
                      <div className="w-24 h-1 bg-indigo-500 rounded-full" />
                      <span>$450 max</span>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg text-xs font-semibold shadow-md">
                    Show 340+ stays
                  </button>
                </div>
              )}

              {/* Spotify Simulation */}
              {selectedChallenge.id === 'spotify-queue-drawer' && (
                <div className="relative z-10 w-full max-w-sm bg-slate-900 rounded-xl border border-slate-700 shadow-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      ♫
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">Midnight City</div>
                      <div className="text-[10px] text-slate-400">M83 • Hurry Up, We're Dreaming</div>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-emerald-500" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-1">Next in Queue</div>
                  <div className="text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg flex items-center justify-between">
                    <span>Starboy — The Weeknd</span>
                    <span className="text-[10px] text-slate-500">3:50</span>
                  </div>
                </div>
              )}
            </div>

            {/* Edge Cases Checklist */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center space-x-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Edge Cases & Failure States:
                </h4>
              </div>

              <div className="space-y-2">
                {selectedChallenge.edgeCases.map((ec, idx) => {
                  const key = `${selectedChallenge.id}-${idx}`;
                  const isChecked = checkedEdgeCases[key] || false;
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleEdgeCase(idx)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked 
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-semibold">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} 
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span>{ec.scenario}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 pl-5">
                        ↳ <span className="text-slate-300 font-medium">Expected Behavior:</span> {ec.expectedBehavior}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Component Tree & State Architecture & Quiz (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Component Hierarchy Tree */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center space-x-2 mb-4">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Recommended Component Hierarchy</h3>
            </div>

            <div className="space-y-3">
              {selectedChallenge.recommendedComponentTree.map((comp) => (
                <div key={comp.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 font-mono">
                      &lt;{comp.name} /&gt;
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-400">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{comp.description}</p>
                  
                  {comp.stateUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-slate-400">State:</span>
                      {comp.stateUsed.map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* State Architecture Blueprint */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">State Architecture Blueprint</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Local State</span>
                <ul className="mt-1 space-y-1 text-slate-300">
                  {selectedChallenge.stateArchitectureGuide.localState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Global State</span>
                <ul className="mt-1 space-y-1 text-slate-300">
                  {selectedChallenge.stateArchitectureGuide.globalState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Server Cache</span>
                <ul className="mt-1 space-y-1 text-slate-300">
                  {selectedChallenge.stateArchitectureGuide.serverCacheState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Architecture Knowledge Check Quiz */}
          <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Interview Architecture Check</h3>
              </div>
              <span className="text-[11px] text-slate-400">Test Your System Design Reasoning</span>
            </div>

            <div className="space-y-4">
              {selectedChallenge.interactiveQuiz.map((q, qIndex) => (
                <div key={qIndex} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-200">
                    {qIndex + 1}. {q.question}
                  </p>

                  <div className="space-y-1.5">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = selectedQuizAnswers[qIndex] === optIndex;
                      const isCorrect = q.correctIndex === optIndex;
                      
                      let styling = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700';
                      if (quizSubmitted) {
                        if (isCorrect) styling = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200';
                        else if (isSelected && !isCorrect) styling = 'bg-red-950/40 border-red-500/60 text-red-200';
                      } else if (isSelected) {
                        styling = 'bg-indigo-600/20 border-indigo-500 text-indigo-200';
                      }

                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleSelectAnswer(qIndex, optIndex)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${styling}`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleCheckQuiz}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  Verify Answers
                </button>

                <button
                  onClick={handleCompleteChallenge}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Pattern Mastered</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
