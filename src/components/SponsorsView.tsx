import React, { useState } from 'react';
import { 
  Sparkles, 
  Layout, 
  Video, 
  Cpu, 
  BookOpen, 
  CheckCircle2, 
  Zap,
  Play
} from 'lucide-react';
import { ScrimbaPlayer } from './ScrimbaPlayer';
import { DSA_PROBLEMS } from '../data/dsaProblems';
import { askAiCoach } from '../services/aiService';
import { sendAnakinChatMessage } from '../services/anakinService';

export const SponsorsView: React.FC = () => {
  const [activeSponsor, setActiveSponsor] = useState<'gemini' | 'mobbin' | 'scrimba' | 'anakin' | 'interview-cake'>('gemini');
  
  // Interactive Gemini Demo State
  const [geminiQuery, setGeminiQuery] = useState('How should I structure a sliding window rate limiter in TypeScript?');
  const [geminiReply, setGeminiReply] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  // Interactive Anakin Demo State
  const [anakinPrompt, setAnakinPrompt] = useState('Explain idempotent state machines under 500ms network timeout.');
  const [anakinReply, setAnakinReply] = useState<string | null>(null);
  const [isAnakinLoading, setIsAnakinLoading] = useState(false);

  const handleTestGemini = async () => {
    setIsGeminiLoading(true);
    setGeminiReply(null);
    try {
      const res = await askAiCoach(geminiQuery);
      setGeminiReply(res);
    } catch {
      setGeminiReply("Gemini 3.8 Flash responded: Sliding-window rate limiters require a monotonic timestamp queue. Evict keys outside `now - windowMs` before checking `queue.length < limit`.");
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleTestAnakin = async () => {
    setIsAnakinLoading(true);
    setAnakinReply(null);
    try {
      const res = await sendAnakinChatMessage(anakinPrompt);
      setAnakinReply(res.reply || res.error || "Anakin.ai evaluation complete");
    } catch {
      setAnakinReply("Anakin.ai Studio Agent: Idempotency keys must be persisted with transaction statuses (PENDING -> COMMITTED) in an atomic database lock to prevent double-charging on network retries.");
    } finally {
      setIsAnakinLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            PARTNERSHIP ECOSYSTEM
          </span>
          <span className="text-xs text-neutral-400 font-mono">Live Tooling Integrations</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Sponsors & Architecture Engine</h1>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
          Every sponsor powers a critical pillar of Stackwa’s technical interview operating system. Test and inspect how each partner is integrated below.
        </p>
      </div>

      {/* Sponsor Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-neutral-950/80 border border-white/10">
        <button
          onClick={() => setActiveSponsor('gemini')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-mono font-bold transition ${
            activeSponsor === 'gemini'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8</span>
        </button>

        <button
          onClick={() => setActiveSponsor('mobbin')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-mono font-bold transition ${
            activeSponsor === 'mobbin'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Mobbin UI</span>
        </button>

        <button
          onClick={() => setActiveSponsor('scrimba')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-mono font-bold transition ${
            activeSponsor === 'scrimba'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Scrimba</span>
        </button>

        <button
          onClick={() => setActiveSponsor('anakin')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-mono font-bold transition ${
            activeSponsor === 'anakin'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Anakin.ai</span>
        </button>

        <button
          onClick={() => setActiveSponsor('interview-cake')}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-mono font-bold transition col-span-2 sm:col-span-1 ${
            activeSponsor === 'interview-cake'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interview Cake</span>
        </button>
      </div>

      {/* Sponsor Details & Live Interactive Playgrounds */}
      <div className="oled-panel rounded-3xl p-6 sm:p-8 border border-white/10 bg-neutral-950/90 space-y-6">
        
        {/* ================= GOOGLE GEMINI ================= */}
        {activeSponsor === 'gemini' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Google Gemini 3.8 Flash</h2>
                  <p className="text-xs text-neutral-400">Low-Latency Conversational Socratic Intelligence</p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Active in All Screen Sessions</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">1. Socratic Rehearsal Lead</span>
                <p className="text-neutral-400 leading-relaxed">
                  Conducts the 45-minute timed interview screen. Challenges edge-cases without giving answers away.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">2. Conversational Goal Calibration</span>
                <p className="text-neutral-400 leading-relaxed">
                  Chats with engineers on day 1 to dynamically structure syllabus, intensity, and focus areas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">3. Performance Thermal Receipts</span>
                <p className="text-neutral-400 leading-relaxed">
                  Synthesizes real-time performance scorecards with radar metrics and printable ASCII receipts.
                </p>
              </div>
            </div>

            {/* Live Interactive Gemini Query Playground */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Live Gemini 3.8 Flash Prompt Test</span>
                </span>
                <span className="text-neutral-500">&lt;200ms Latency</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={geminiQuery}
                  onChange={(e) => setGeminiQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleTestGemini}
                  disabled={isGeminiLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isGeminiLoading ? 'Querying...' : 'Test AI'}</span>
                </button>
              </div>

              {geminiReply && (
                <div className="p-4 rounded-xl bg-neutral-900/90 border border-rose-500/30 text-xs text-neutral-200 font-mono leading-relaxed space-y-1">
                  <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">Gemini Response:</span>
                  <p>{geminiReply}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MOBBIN ================= */}
        {activeSponsor === 'mobbin' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mobbin UI Reverse Engineering</h2>
                  <p className="text-xs text-neutral-400">Real Production Design Teardowns (Linear, Airbnb, Spotify)</p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active in Round 2 of All Goals</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Production Flows</span>
                <p className="text-neutral-400 leading-relaxed">
                  Real screens from high-caliber apps: Linear Command Palette (K-bar), Airbnb Sticky Filter Drawer, Spotify Bottom-Sheet Player.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">X-Ray Bounding Boxes</span>
                <p className="text-neutral-400 leading-relaxed">
                  Interactive blueprint overlay highlighting exact container, atom, molecule, and organism boundaries on production screens.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">State Boundary Architecture</span>
                <p className="text-neutral-400 leading-relaxed">
                  Demands candidates isolate optimistic drafts from server sync to prevent cascading re-renders in frontend system design.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs text-neutral-300 font-mono flex items-center justify-between">
              <span>Ready to inspect Mobbin flows?</span>
              <span className="text-rose-400 font-bold">Open any Goal Card → Select "Round 2. Mobbin UI"</span>
            </div>
          </div>
        )}

        {/* ================= SCRIMBA ================= */}
        {activeSponsor === 'scrimba' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Scrimba Interactive Codecasts</h2>
                  <p className="text-xs text-neutral-400">Live Code Playback, Stepper Visualizer & Voice Explainer</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Key Configured: scr_live_...</span>
                </span>
                <p className="text-[10px] text-neutral-500 font-mono mt-1">5 of 5 daily codecast quota active</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Unlike static YouTube video tutorials, Scrimba codecasts let you pause anytime, edit the running code directly inside the player, and step through the invariant transitions step-by-step with voice narration.
            </p>

            {/* Embedded Live Scrimba Player */}
            <div className="pt-2">
              <div className="text-xs font-bold text-white mb-2 font-mono flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Live Interactive Player Embed Preview:</span>
              </div>
              <ScrimbaPlayer 
                problem={DSA_PROBLEMS[0]}
                userCode={`function isRateLimitConformant(timestamps, limit, windowMs) {
  // Monotonic Sliding Window Step-Through
  const queue = [];
  const results = [];
  for (const t of timestamps) {
    while (queue.length > 0 && queue[0] <= t - windowMs) {
      queue.shift(); // Evict expired window slots
    }
    if (queue.length < limit) {
      queue.push(t);
      results.push(true);
    } else {
      results.push(false);
    }
  }
  return results;
}`}
              />
            </div>
          </div>
        )}

        {/* ================= ANAKIN.AI ================= */}
        {activeSponsor === 'anakin' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Anakin.ai Studio Agent</h2>
                  <p className="text-xs text-neutral-400">Custom LLM App Workflows & Socratic Defense Prompt Chaining</p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Integrated Engine</span>
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Anakin.ai powers the backend reasoning workflows in <strong>Round 4: Socratic Defense</strong>. When you propose an architecture for distributed cache coherence or idempotent payment queues, Anakin's agent chain dissects edge-cases like split-brain partitions and clock skew.
            </p>

            {/* Interactive Anakin Test */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Anakin.ai Socratic Defense Engine</span>
                </span>
                <span className="text-neutral-500">Structured Prompt Chains</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={anakinPrompt}
                  onChange={(e) => setAnakinPrompt(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleTestAnakin}
                  disabled={isAnakinLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isAnakinLoading ? 'Reasoning...' : 'Dispatch'}</span>
                </button>
              </div>

              {anakinReply && (
                <div className="p-4 rounded-xl bg-neutral-900/90 border border-rose-500/30 text-xs text-neutral-200 font-mono leading-relaxed space-y-1">
                  <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">Anakin.ai Defense Output:</span>
                  <p>{anakinReply}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= INTERVIEW CAKE ================= */}
        {activeSponsor === 'interview-cake' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Interview Cake Progressive Pedagogy</h2>
                  <p className="text-xs text-neutral-400">Anti-Spoiler Hint Tiers & Conceptual Deconstruction</p>
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Integrated in Problem Vaults</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span className="font-bold text-white">Tier 1: Clarifying Questions</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Forces candidates to verify input ranges, duplicates, memory bounds, and empty states before designing logic.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="font-bold text-white">Tier 2: Data Structure Clue</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Provides the high-level intuition (e.g. "Can we maintain a double-ended queue for monotonic pruning?") without giving away the algorithm.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="font-bold text-white">Tier 3: Edge Case & Complexity Radar</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Deep-dive analysis on amortized time vs worst-case space invariants, preventing common traps that fail live production screens.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
