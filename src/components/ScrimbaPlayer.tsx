import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  ExternalLink,
  Sparkles,
  Bot,
  Video,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DsaProblem } from '../types';
import { createScrimbaExplainer } from '../services/scrimbaService';

interface ScrimbaPlayerProps {
  problem: DsaProblem;
  userCode?: string;
}

export const ScrimbaPlayer: React.FC<ScrimbaPlayerProps> = ({ problem, userCode }) => {
  const [explainerId, setExplainerId] = useState<string | null>(problem.scrimbaEmbedId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<'standard' | 'eli5' | 'professor' | 'tldr' | 'lol'>('standard');
  const [mode, setMode] = useState<'landscape' | 'portrait'>('landscape');
  const [activeTab, setActiveTab] = useState<'official-iframe' | 'interactive-stepper'>(explainerId ? 'official-iframe' : 'interactive-stepper');

  // Interactive visualizer local frame state
  const [stepIndex, setStepIndex] = useState(0);

  const sampleArray = [10, 7, 5, 8, 11, 9];
  const steps = [
    { title: "Initialize Pointers", desc: "Setting up baseline boundary indices and initial comparison thresholds.", activeIdx: 0 },
    { title: "First Traversal", desc: "Sliding window checks threshold condition against target invariant.", activeIdx: 1 },
    { title: "Boundary Shift", desc: "Monotonic bound updates with optimal local candidate.", activeIdx: 2 },
    { title: "Target Match", desc: "Optimal sub-array range satisfies constraints in O(n) single-pass.", activeIdx: 4 }
  ];

  const handleGenerateOfficialScrimba = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    const promptText = `Explain step-by-step how to solve this technical interview challenge: "${problem.title}". Context: ${problem.description}. Explain invariants, time complexity (${problem.timeComplexity}), and defensive edge cases.`;

    const res = await createScrimbaExplainer({
      prompt: promptText,
      codeSnippet: userCode || (typeof problem.starterCode === 'string' ? problem.starterCode : problem.starterCode.javascript),
      filename: 'solution.js',
      mode,
      teacher
    });

    setIsGenerating(false);

    if (res.success && res.explainerId) {
      setExplainerId(res.explainerId);
      setActiveTab('official-iframe');
    } else {
      setErrorMessage(res.error || "Failed to generate Scrimba explainer. (Check API quota or connection)");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header */}
      <div className="bg-neutral-900/90 px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center space-x-2">
              <span>Codecast Explainer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                Official Scrimba API Connected
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">{problem.title} • {problem.timeComplexity}</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px]">
            <button
              onClick={() => setActiveTab('official-iframe')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'official-iframe' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Official Iframe
            </button>
            <button
              onClick={() => setActiveTab('interactive-stepper')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'interactive-stepper' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Visual Stepper
            </button>
          </div>

          {explainerId && (
            <a
              href={`https://scrimba.com/explain/${explainerId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition font-mono text-[11px]"
            >
              <span>Open on Scrimba</span>
              <ExternalLink className="w-3 h-3 text-rose-400" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {activeTab === 'official-iframe' ? (
        <div className="p-6 bg-black min-h-[380px] flex flex-col items-center justify-center">
          {explainerId ? (
            <div className="w-full h-[400px] rounded-xl overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl">
              <iframe
                src={`https://scrimba.com/explain/${explainerId}`}
                title="Scrimba Codecast Explainer"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Generate Official Scrimba Explainer</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Synthesizes an interactive AI-narrated codecast directly using your connected Scrimba API key.
                </p>
              </div>

              {/* Persona & Layout Selectors */}
              <div className="grid grid-cols-2 gap-2 text-left pt-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block mb-1">Teacher Persona</label>
                  <select
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value as any)}
                    className="w-full bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="standard">Standard Engineer</option>
                    <option value="eli5">ELI5 (Beginner)</option>
                    <option value="professor">Professor (Deep Theory)</option>
                    <option value="tldr">TL;DR (Rapid Paced)</option>
                    <option value="lol">Humorous (LOL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block mb-1">Aspect Ratio</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="landscape">16:9 Landscape</option>
                    <option value="portrait">9:16 Portrait</option>
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleGenerateOfficialScrimba}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Bot className="w-4 h-4 animate-spin" />
                    <span>Contacting Scrimba API...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Generate Scrimba Explainer (1 Credit)</span>
                  </>
                )}
              </button>

              <span className="text-[10px] font-mono text-neutral-500 block">
                Authenticated via Bearer API Key • Embeds via official Scrimba iFrame
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Visual Stepper View */
        <div className="p-6 bg-black min-h-[380px] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-rose-400 font-bold uppercase tracking-wider">
                Interactive State Trace — Step {stepIndex + 1} of {steps.length}
              </span>
              <span className="font-mono">Time Complexity: {problem.timeComplexity}</span>
            </div>

            {/* Array Bar Chart Visualizer */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-white/10">
              <div className="flex items-end justify-center space-x-3 h-28 pt-2">
                {sampleArray.map((val, idx) => {
                  const isActive = idx === steps[stepIndex].activeIdx;
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-1.5 flex-1 max-w-[48px]">
                      <span className="text-[10px] font-mono text-neutral-400">${val}</span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 border ${
                          isActive
                            ? 'bg-rose-600 border-rose-400 shadow-lg shadow-rose-600/50 scale-105'
                            : 'bg-neutral-800 border-white/10'
                        }`}
                        style={{ height: `${val * 8}px` }}
                      />
                      <span className="text-[10px] font-mono text-neutral-500">i={idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Explanation Card */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{steps[stepIndex].title}</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {steps[stepIndex].desc}
              </p>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              onClick={() => setStepIndex(0)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                disabled={stepIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-neutral-300 text-xs transition border border-white/10"
              >
                Previous Step
              </button>
              <button
                onClick={() => setStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                disabled={stepIndex === steps.length - 1}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-md shadow-rose-600/20"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
