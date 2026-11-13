import React, { useState } from 'react';
import { 
  CheckCircle, 
  Sparkles, 
  Eye, 
  Database, 
  Terminal, 
  Search, 
  FolderTree, 
  ExternalLink,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UI_CHALLENGES } from '../data/uiFlows';
import { UiDesignChallenge, UiComponentItem } from '../types';

interface UiDesignStudioProps {
  onCompleteFlow: (flowId: string) => void;
  completedFlowIds: string[];
}

export const UiDesignStudio: React.FC<UiDesignStudioProps> = ({ 
  onCompleteFlow, 
  completedFlowIds 
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<UiDesignChallenge>(UI_CHALLENGES[0]);
  const [hoveredNode, setHoveredNode] = useState<UiComponentItem | null>(null);
  const [checkedEdgeCases, setCheckedEdgeCases] = useState<{ [key: string]: boolean }>({
    [`${UI_CHALLENGES[0].id}-0`]: true
  });
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [quizIndex: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleSelectChallenge = (challenge: UiDesignChallenge) => {
    setSelectedChallenge(challenge);
    setHoveredNode(null);
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

  // Calculate Edge-Case Radar completion
  const totalEdgeCases = selectedChallenge.edgeCases.length;
  const verifiedCount = selectedChallenge.edgeCases.filter((_, i) => checkedEdgeCases[`${selectedChallenge.id}-${i}`]).length;
  const radarPercent = Math.round((verifiedCount / totalEdgeCases) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Challenge Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-mono">Mobbin Flow:</span>
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
                  : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/15 hover:text-white'
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
        
        {/* Left Column: Split-Pane "Anatomy" Mode (Mobbin screen + X-Ray Box) (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Header Card */}
          <div className="oled-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  {selectedChallenge.company}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-neutral-300 border border-white/10">
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
                <span>Mobbin Spec</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">{selectedChallenge.title}</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {selectedChallenge.appContext}
            </p>

            <div className="bg-black/60 rounded-xl p-3 border border-white/5 text-xs text-neutral-300">
              <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">User Story: </span>
              <span className="italic">{selectedChallenge.userStory}</span>
            </div>
          </div>

          {/* Interactive "Anatomy" Screen Mockup with X-Ray Box Overlay */}
          <div className="oled-panel rounded-2xl p-6 border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Split-Pane "Anatomy" Screen Canvas</h3>
              </div>
              <span className="text-[10px] text-purple-300 font-mono">
                {hoveredNode ? `X-Ray: <${hoveredNode.name} />` : 'Hover component node on right to cast X-Ray'}
              </span>
            </div>

            {/* Screen Mockup Container with X-Ray Bounding Box */}
            <div className="relative rounded-xl border border-white/10 bg-black p-6 flex flex-col items-center justify-center min-h-[290px] overflow-hidden shadow-2xl">
              
              {/* Dynamic X-Ray Overlay Bounding Box */}
              {hoveredNode && (
                <div 
                  className="absolute z-20 pointer-events-none transition-all duration-300 border-2 border-dashed border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/30 rounded-lg flex items-start justify-end p-1.5"
                  style={{
                    top: `${hoveredNode.xRayBox.top}%`,
                    left: `${hoveredNode.xRayBox.left}%`,
                    width: `${hoveredNode.xRayBox.width}%`,
                    height: `${hoveredNode.xRayBox.height}%`
                  }}
                >
                  <span className="text-[9px] font-mono font-bold bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded shadow">
                    &lt;{hoveredNode.name} /&gt;
                  </span>
                </div>
              )}

              {/* Linear Simulation */}
              {selectedChallenge.id === 'linear-command-palette' && (
                <div className="relative z-10 w-full max-w-sm bg-neutral-900/90 backdrop-blur-md rounded-xl border border-white/15 shadow-2xl overflow-hidden">
                  <div className="flex items-center px-3 py-2.5 border-b border-white/10 space-x-2">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Type a command or search issues..." 
                      className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
                      defaultValue="create issue"
                    />
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">ESC</kbd>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 px-2 py-1 font-mono">Actions</div>
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-purple-600/20 border border-purple-500/40 text-xs text-white">
                      <div className="flex items-center space-x-2">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        <span>Create new issue</span>
                      </div>
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-neutral-400 border border-white/10">C</kbd>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-neutral-400">
                      <div className="flex items-center space-x-2">
                        <Terminal className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Search shortcuts & docs</span>
                      </div>
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-neutral-500 border border-white/10">?</kbd>
                    </div>
                  </div>
                </div>
              )}

              {/* Airbnb Simulation */}
              {selectedChallenge.id === 'airbnb-filter-drawer' && (
                <div className="relative z-10 w-full max-w-sm bg-neutral-900 rounded-xl border border-white/15 shadow-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="text-xs font-bold text-white">Filters</h4>
                    <span className="text-[10px] text-neutral-400">Clear all</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-neutral-300">Price range</div>
                    <div className="h-10 bg-black/60 rounded-lg flex items-center justify-around px-2 text-[10px] text-neutral-400 border border-white/5">
                      <span>$50 min</span>
                      <div className="w-24 h-1 bg-purple-500 rounded-full" />
                      <span>$450 max</span>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg text-xs font-semibold shadow-md">
                    Show 340+ stays
                  </button>
                </div>
              )}

              {/* Spotify Simulation */}
              {selectedChallenge.id === 'spotify-queue-drawer' && (
                <div className="relative z-10 w-full max-w-sm bg-neutral-900 rounded-xl border border-white/15 shadow-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      ♫
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">Midnight City</div>
                      <div className="text-[10px] text-neutral-400">M83 • Hurry Up, We're Dreaming</div>
                    </div>
                  </div>
                  <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-emerald-500" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500 pt-1">Next in Queue</div>
                  <div className="text-xs text-neutral-300 bg-black/40 p-2 rounded-lg flex items-center justify-between border border-white/5">
                    <span>Starboy — The Weeknd</span>
                    <span className="text-[10px] text-neutral-500">3:50</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* The Edge-Case Radar (Defensive UI Engineering) */}
          <div className="oled-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">The Edge-Case Radar</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {verifiedCount} / {totalEdgeCases} Verified ({radarPercent}%)
              </span>
            </div>

            {/* Radar Meter Bar */}
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${radarPercent}%` }}
              />
            </div>

            {/* Radar Checklist */}
            <div className="space-y-2">
              {selectedChallenge.edgeCases.map((ec, idx) => {
                const key = `${selectedChallenge.id}-${idx}`;
                const isChecked = checkedEdgeCases[key] || false;
                
                return (
                  <div 
                    key={idx}
                    onClick={() => toggleEdgeCase(idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start space-x-3 ${
                      isChecked 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                        : 'bg-black/60 border-white/5 text-neutral-400 hover:border-white/15'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => {}} 
                      className="rounded text-purple-600 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{ec.scenario}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded uppercase font-mono bg-white/10 text-neutral-300">
                          {ec.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        ↳ Expected: {ec.expectedBehavior}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Component Tree Toolkit & State Blueprint & Quiz (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Component Hierarchy Tree Toolkit */}
          <div className="oled-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Component Hierarchy & X-Ray Toolkit</h3>
              </div>
              <span className="text-[10px] text-neutral-500">Hover node to inspect on canvas</span>
            </div>

            <div className="space-y-3">
              {selectedChallenge.recommendedComponentTree.map((comp) => {
                const isHovered = hoveredNode?.id === comp.id;
                return (
                  <div 
                    key={comp.id}
                    onMouseEnter={() => setHoveredNode(comp)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
                      isHovered 
                        ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                        : 'bg-black/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 font-mono">
                        &lt;{comp.name} /&gt;
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-white/5 text-neutral-400 font-mono">
                        {comp.type}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{comp.description}</p>
                    
                    {comp.stateUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-neutral-500">State:</span>
                        {comp.stateUsed.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* State Architecture Blueprint */}
          <div className="oled-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">State Architecture Blueprint</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">Local State</span>
                <ul className="mt-1 space-y-1 text-neutral-300">
                  {selectedChallenge.stateArchitectureGuide.localState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">Global State</span>
                <ul className="mt-1 space-y-1 text-neutral-300">
                  {selectedChallenge.stateArchitectureGuide.globalState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Server Cache</span>
                <ul className="mt-1 space-y-1 text-neutral-300">
                  {selectedChallenge.stateArchitectureGuide.serverCacheState.map((item, i) => (
                    <li key={i} className="text-[11px] leading-tight">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Architecture Knowledge Check Quiz */}
          <div className="oled-panel rounded-2xl p-6 border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">System Architecture Defense</h3>
              </div>
              <span className="text-[11px] text-neutral-400">FAANG System Design Reasoning</span>
            </div>

            <div className="space-y-4">
              {selectedChallenge.interactiveQuiz.map((q, qIndex) => (
                <div key={qIndex} className="space-y-2">
                  <p className="text-xs font-semibold text-neutral-200">
                    {qIndex + 1}. {q.question}
                  </p>

                  <div className="space-y-1.5">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = selectedQuizAnswers[qIndex] === optIndex;
                      const isCorrect = q.correctIndex === optIndex;
                      
                      let styling = 'bg-black/60 border-white/5 text-neutral-300 hover:border-white/15';
                      if (quizSubmitted) {
                        if (isCorrect) styling = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200';
                        else if (isSelected && !isCorrect) styling = 'bg-rose-950/40 border-rose-500/60 text-rose-200';
                      } else if (isSelected) {
                        styling = 'bg-purple-600/20 border-purple-500 text-purple-200';
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
                    <p className="text-[11px] text-neutral-400 italic pt-1">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleCheckQuiz}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Verify Answers
                </button>

                <button
                  onClick={handleCompleteChallenge}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5"
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
