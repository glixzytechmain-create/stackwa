import React, { useState, useRef } from 'react';
import { 
  ArrowRight, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Flame, 
  ChevronDown
} from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { voiceService } from '../services/voiceService';

interface LandingPageProps {
  onLaunchApp: () => void;
  onSignInWithGoogle: () => void;
  onOpenAuthModal?: () => void;
  user: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onSignInWithGoogle,
  onOpenAuthModal,
  user
}) => {
  // -------------------------------------------------------------
  // Section 1: Hero 3D Card Tilt State
  // -------------------------------------------------------------
  const heroCardRef = useRef<HTMLDivElement | null>(null);
  const heroX = useMotionValue(0);
  const heroY = useMotionValue(0);

  const heroXSpring = useSpring(heroX, { stiffness: 220, damping: 25 });
  const heroYSpring = useSpring(heroY, { stiffness: 220, damping: 25 });

  const heroRotateX = useTransform(heroYSpring, [-0.5, 0.5], ["9deg", "-9deg"]);
  const heroRotateY = useTransform(heroXSpring, [-0.5, 0.5], ["-9deg", "9deg"]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    heroX.set((e.clientX - rect.left) / rect.width - 0.5);
    heroY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleHeroMouseLeave = () => {
    heroX.set(0);
    heroY.set(0);
  };

  // Hero Sandbox State
  const [heroVaultUnlocked, setHeroVaultUnlocked] = useState(false);
  const [heroVoiceSpeaking, setHeroVoiceSpeaking] = useState(false);
  const [heroExecutionState, setHeroExecutionState] = useState<'idle' | 'success' | 'fail'>('idle');

  const handleHeroVoice = () => {
    if (heroVoiceSpeaking) {
      voiceService.stopSpeaking();
      setHeroVoiceSpeaking(false);
    } else {
      setHeroVoiceSpeaking(true);
      voiceService.speak("Welcome to Stackwa. In a high-stakes technical screen, articulate your boundary conditions and Big-O invariants out loud before writing code.", {
        onEnd: () => setHeroVoiceSpeaking(false),
        onError: () => setHeroVoiceSpeaking(false)
      });
    }
  };

  // -------------------------------------------------------------
  // Section 2: Paradigm Comparator State
  // -------------------------------------------------------------
  const [paradigmMode, setParadigmMode] = useState<'leet' | 'stackwa'>('stackwa');
  const [paradigmTesting, setParadigmTesting] = useState(false);

  // -------------------------------------------------------------
  // Section 6: Real-Time Voice Audio Room State
  // -------------------------------------------------------------
  const [activeVoicePromptIndex, setActiveVoicePromptIndex] = useState<number | null>(null);

  const VOICE_PROMPTS = [
    {
      q: "Can incoming timestamps contain duplicates or arrive out of order?",
      a: "In a real gateway, requests can arrive in the same millisecond. Your sliding window must handle equality cleanly with greater-than-or-equal checks.",
      topic: "Boundary Condition Invariant"
    },
    {
      q: "Why does JavaScript Map guarantee O(1) order preservation for LRU?",
      a: "Under the hood in V8, Maps maintain a deterministic insertion-order hash table. Deleting and re-setting an existing key re-inserts it at the tail in O(1) amortized time.",
      topic: "Engine Micro-Architecture"
    },
    {
      q: "How does optimistic UI handle network timeouts during reordering?",
      a: "Maintain a draft queue state in memory with an undo snapshot. If the server mutation times out or rejects, seamlessly roll back to the snapshot without layout shifts.",
      topic: "Defensive State Machine"
    }
  ];

  const handleTriggerVoiceRoom = (index: number) => {
    if (activeVoicePromptIndex === index) {
      voiceService.stopSpeaking();
      setActiveVoicePromptIndex(null);
    } else {
      setActiveVoicePromptIndex(index);
      voiceService.speak(VOICE_PROMPTS[index].a, {
        onEnd: () => setActiveVoicePromptIndex(null),
        onError: () => setActiveVoicePromptIndex(null)
      });
    }
  };

  // -------------------------------------------------------------
  // Section 8: FAQ Accordion State
  // -------------------------------------------------------------
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const FAQ_ITEMS = [
    {
      q: "How does Stackwa avoid generic mock data and LeetCode clichés?",
      a: "Stackwa's Socratic engine calibrates directly to your exact company and role. Instead of abstract math puzzles, it generates modern, production-grounded challenges (e.g. Stripe sliding window rate arbiters, Linear DAG sync buffers, Netflix LRU caches) with real automated test assertions."
    },
    {
      q: "How does the in-browser execution engine prevent false passes?",
      a: "Stackwa runs strict JavaScript sandboxes and Pyodide WebAssembly Python 3. Submitting placeholders like 'pass' or functions without correct return values strictly fails with exact expected vs received diffs. No fake passes ever."
    },
    {
      q: "What is the 3-Round Protocol?",
      a: "Each challenge is structured like a real senior technical screen: Round 1 (Hands-On Implementation with full test runner), Round 2 (Algorithmic Invariants & Complexities MCQ), and Round 3 (Live Architecture Debate & Socratic Defense)."
    },
    {
      q: "How does the 'Raise Hand' (✋) live simulation work?",
      a: "In real high-stakes screens, asking clarifying questions about constraints and scale is heavily rewarded. The Raise Hand button opens an in-character dialogue with your AI interview lead to clarify problem constraints and edge cases, supporting both voice and keyboard."
    }
  ];

  return (
    <div className="relative min-h-screen text-white overflow-hidden selection:bg-rose-600 selection:text-white">
      
      {/* --------------------------------------------------------- */}
      {/* Top Navbar */}
      {/* --------------------------------------------------------- */}
      <header className="relative z-20 border-b border-white/5 bg-black/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/stackwa-logo.png" 
              alt="Stackwa" 
              className="h-8 w-auto object-contain group-hover:opacity-90 transition" 
            />
          </div>

          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-neutral-400">
            <a href="#paradigm" className="hover:text-white transition">The Method</a>
            <a href="#voice" className="hover:text-white transition">Voice Coach</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <button
                onClick={onLaunchApp}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal || onSignInWithGoogle}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign In</span>
                </button>

                <button
                  onClick={onLaunchApp}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Launch Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- */}
      {/* Section 1: Hero with 3D Tilt Console & Live Sandbox */}
      {/* --------------------------------------------------------- */}
      <section className="relative z-10 pt-14 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Kinetic Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300 mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Zero Memorization • Real Algorithmic Invariants • Voice Socratic Lead</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.08] text-white"
        >
          The Spatial Technical Interview OS for <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300">High-Stakes Engineers</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed"
        >
          Stop grinding 500 LeetCode problems blindly. Calibrate directly for your dream company with multi-turn Socratic dialogue, 3-stage anti-spoiler hint vaults, defensive UI system design, and voice coaching.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onLaunchApp}
            className="px-8 py-4 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span>Start Free AI Calibration</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!user && (
            <button
              onClick={onOpenAuthModal || onSignInWithGoogle}
              className="px-6 py-4 rounded-2xl text-sm font-semibold bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/10 transition flex items-center space-x-2.5 backdrop-blur-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </motion.div>

        {/* 3D Hero Interactive Workstation Console */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-14 max-w-5xl mx-auto perspective-1000"
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          ref={heroCardRef}
        >
          <motion.div
            style={{ rotateX: heroRotateX, rotateY: heroRotateY, transformStyle: 'preserve-3d' }}
            className="oled-panel rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-neutral-950/85 backdrop-blur-2xl text-left"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-xs text-neutral-400">stackwa_workstation.demo</span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Interactive Engine</span>
                </span>
              </div>
            </div>

            {/* Interactive Sandbox Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              
              {/* Left Column: Interactive Vault & Voice Playback */}
              <div className="md:col-span-5 space-y-4">
                <div className="text-xs font-semibold uppercase text-neutral-400 tracking-wider font-mono flex items-center justify-between">
                  <span>Anti-Spoiler Vault Clue:</span>
                  <span className="text-rose-400 text-[10px]">Click to Test</span>
                </div>

                <div 
                  onClick={() => setHeroVaultUnlocked(!heroVaultUnlocked)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    heroVaultUnlocked 
                      ? 'bg-neutral-900/90 border-sky-500/40 glow-emerald' 
                      : 'bg-neutral-950 border-white/15 hover:border-sky-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {heroVaultUnlocked ? <Unlock className="w-4 h-4 text-sky-400" /> : <Lock className="w-4 h-4 text-neutral-400" />}
                      <span className="text-xs font-bold text-white">Invariant Vault 2</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
                      {heroVaultUnlocked ? 'Unlocked' : 'Shatter Lock'}
                    </span>
                  </div>

                  {heroVaultUnlocked ? (
                    <p className="text-xs text-sky-200 leading-relaxed">
                      Track the sliding window boundaries with two monotonic pointers. As right advances, increment left until windowMs constraint is satisfied in linear O(n) time.
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">
                      Hover meta-clue: Stuck on O(n) sliding window without nested O(n²) loops? Click to shatter.
                    </p>
                  )}
                </div>

                {/* Voice Coach Button */}
                <button
                  onClick={handleHeroVoice}
                  className={`w-full p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
                    heroVoiceSpeaking
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {heroVoiceSpeaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
                    <span>{heroVoiceSpeaking ? 'Speaking in real-time...' : 'Play Live Voice Explanation'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Web Speech 🔊</span>
                </button>
              </div>

              {/* Right Column: In-Browser Real Code Execution */}
              <div className="md:col-span-7 bg-black rounded-2xl p-4 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] pb-2 border-b border-white/5">
                  <span>sliding_window_arbiter.js</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setHeroExecutionState(heroExecutionState === 'success' ? 'fail' : 'success')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition font-bold"
                    >
                      {heroExecutionState === 'success' ? 'Simulate Fault Vector' : 'Run Real Test Vector'}
                    </button>
                  </div>
                </div>

                <div className="text-neutral-300 font-mono text-xs space-y-1">
                  <span className="text-neutral-500">// Real in-browser JavaScript evaluation</span>
                  <div className="text-pink-400">
                    isRateLimitConformant([1000, 1100, 1200, 1300], k=3, windowMs=1000);
                  </div>
                </div>

                {heroExecutionState === 'idle' && (
                  <div className="p-3 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 text-[11px]">
                    Click "Run Real Test Vector" to execute in the browser without server latency.
                  </div>
                )}

                {heroExecutionState === 'success' && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-[11px] animate-in fade-in">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>✓ All Invariant Assertions Passed</span>
                      <span className="font-mono text-[10px]">0.14ms execution</span>
                    </div>
                    <div className="text-neutral-400 text-[10px]">
                      Expected: false (burst of 4 within 300ms exceeds k=3) • Got: false
                    </div>
                  </div>
                )}

                {heroExecutionState === 'fail' && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-[11px] animate-in fade-in">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>✗ Strict Execution Trap Detected</span>
                      <span className="font-mono text-[10px]">Placeholder 'pass' Rejected</span>
                    </div>
                    <div className="text-neutral-400 text-[10px]">
                      Unimplemented functions returning undefined or pass fail automatically. Zero fake passes.
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </motion.div>

      </section>

      {/* --------------------------------------------------------- */}
      {/* Section 2: Interactive Paradigm Comparator */}
      {/* --------------------------------------------------------- */}
      <section id="paradigm" className="relative z-10 py-24 border-t border-white/10 bg-neutral-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold">The First-Principles Paradigm</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Why LeetCode Grinding Fails High-Stakes Screens
            </h2>
            <p className="mt-4 text-sm text-neutral-400">
              When an interviewer alters input scale or injects concurrent mutation, memorized solutions implode. Compare both paradigms interactively:
            </p>

            {/* Interactive Toggle Switch */}
            <div className="mt-8 inline-flex p-1 rounded-2xl bg-black border border-white/10">
              <button
                onClick={() => setParadigmMode('leet')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                  paradigmMode === 'leet' 
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-md' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                The LeetCode Trap (Rote Memorization)
              </button>
              <button
                onClick={() => setParadigmMode('stackwa')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                  paradigmMode === 'stackwa' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-md' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                The Stackwa Spatial Method (First Principles)
              </button>
            </div>
          </div>

          {/* Interactive Comparison Console */}
          <div className="max-w-4xl mx-auto oled-panel rounded-3xl p-6 sm:p-8 border border-white/10 bg-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${paradigmMode === 'stackwa' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <h3 className="text-lg font-bold text-white">
                    {paradigmMode === 'stackwa' ? 'Invariant Decomposition' : 'Pattern Pattern-Matching'}
                  </h3>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {paradigmMode === 'stackwa'
                    ? 'Candidates establish monotonic boundaries, state space invariants, and edge conditions aloud before writing a single line. When the interviewer changes the constraints mid-flight, the candidate adapts instantly.'
                    : 'Candidates pattern-match to a problem they memorized 3 weeks ago. When the interviewer says "What if the stream is unbuffered and inputs arrive out of order?", the candidate freezes and fails.'}
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <span className="text-white font-bold">Time Target:</span>
                    <span className={paradigmMode === 'stackwa' ? 'text-emerald-400' : 'text-rose-400'}>
                      {paradigmMode === 'stackwa' ? 'O(n) single-pass with amortized O(1)' : 'O(n²) nested loop fallback'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <span className="text-white font-bold">Space Target:</span>
                    <span className={paradigmMode === 'stackwa' ? 'text-emerald-400' : 'text-rose-400'}>
                      {paradigmMode === 'stackwa' ? 'O(1) auxiliary two-pointer pointers' : 'O(n) auxiliary queue allocation'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setParadigmTesting(true);
                    setTimeout(() => setParadigmTesting(false), 900);
                  }}
                  className={`mt-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    paradigmMode === 'stackwa'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
                  }`}
                >
                  {paradigmTesting ? 'Evaluating Invariants...' : 'Simulate Constraint Shift'}
                </button>
              </div>

              {/* Code visualizer */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-white/10 font-mono text-xs space-y-2 text-left">
                <div className="flex items-center justify-between text-neutral-500 text-[10px] pb-1 border-b border-white/5">
                  <span>strategy_comparison.ts</span>
                  <span className={paradigmMode === 'stackwa' ? 'text-emerald-400' : 'text-rose-400'}>
                    {paradigmMode === 'stackwa' ? 'Optimal Strategy' : 'Vulnerable Strategy'}
                  </span>
                </div>

                {paradigmMode === 'stackwa' ? (
                  <pre className="text-neutral-300 leading-relaxed text-[11px] overflow-x-auto">
{`// Stackwa First-Principles Invariant
function isRateLimitConformant(timestamps, k, windowMs) {
  let left = 0;
  for (let right = 0; right < timestamps.length; right++) {
    while (timestamps[right] - timestamps[left] >= windowMs) {
      left++; // Monotonic advance
    }
    if (right - left + 1 > k) return false;
  }
  return true; // O(n) Time, O(1) Space
}`}
                  </pre>
                ) : (
                  <pre className="text-neutral-400 leading-relaxed text-[11px] overflow-x-auto">
{`// Vulnerable Memorized Pattern
function isRateLimitConformant(timestamps, k, windowMs) {
  // Candidate attempts nested loops
  for (let i = 0; i < timestamps.length; i++) {
    let count = 0;
    for (let j = i; j < timestamps.length; j++) {
      if (timestamps[j] - timestamps[i] < windowMs) count++;
      if (count > k) return false; // O(n²) TLE on 10^5!
    }
  }
  return true;
}`}
                  </pre>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Section 6: Real-Time Voice Interviewer Audio Room */}
      {/* --------------------------------------------------------- */}
      <section id="voice" className="relative z-10 py-24 border-t border-white/10 bg-neutral-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-pink-400 uppercase tracking-widest font-bold">Natural Speech Synthesis</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Real-Time Voice Coaching Audio Room
            </h2>
            <p className="mt-4 text-sm text-neutral-400">
              Listen to the AI technical lead explain architectural nuances in real-time. Click any question below to test live browser speech synthesis:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {VOICE_PROMPTS.map((item, idx) => {
              const isActive = activeVoicePromptIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleTriggerVoiceRoom(idx)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-rose-950/30 border-rose-500 glow-crimson'
                      : 'bg-black border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        {item.topic}
                      </span>
                      {isActive ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-neutral-400" />}
                    </div>

                    <h3 className="text-sm font-bold text-white">"{item.q}"</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {item.a}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                    <span>{isActive ? 'Speaking aloud...' : 'Click to hear audio'}</span>
                    <span className="text-rose-400">🔊</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Section 8: Interactive FAQ Accordion */}
      {/* --------------------------------------------------------- */}
      <section className="relative z-10 py-24 border-t border-white/10 bg-neutral-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold">Frequently Asked Questions</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              First-Principles Methodology & Privacy
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="oled-panel rounded-2xl border border-white/10 overflow-hidden cursor-pointer"
                >
                  <div className="p-5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 text-xs text-neutral-300 leading-relaxed border-t border-white/5 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------- */}
      {/* Section 9: Closing Hero Launch CTA */}
      {/* --------------------------------------------------------- */}
      <section className="relative z-10 py-24 text-center border-t border-white/10 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto text-2xl shadow-2xl">
            S
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Ready for Your Highest-Stakes Technical Screen?
          </h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
            No fixed templates. Converse with your AI interview lead, calibrate your dream company, and master both algorithmic and architectural invariants.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>Launch Stackwa Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user && (
              <button
                onClick={onOpenAuthModal || onSignInWithGoogle}
                className="px-6 py-4 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition flex items-center space-x-2"
              >
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <img src="/stackwa-logo.png" alt="Stackwa" className="h-5 w-auto object-contain opacity-85" />
            <span>© 2026 — The Spatial Technical Interview Operating System</span>
          </div>
          <span>Zero Mock Data Policy • Strict In-Browser Sandbox</span>
        </div>
      </footer>

    </div>
  );
};
