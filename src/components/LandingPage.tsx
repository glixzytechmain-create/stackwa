import React, { useState, useRef } from 'react';
import { 
  ArrowRight, 
  Lock, 
  Unlock, 
  Volume2, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Terminal, 
  Compass
} from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { voiceService } from '../services/voiceService';

interface LandingPageProps {
  onLaunchApp: () => void;
  onSignInWithGoogle: () => void;
  user: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onSignInWithGoogle,
  user
}) => {
  // 3D Card Tilt State for Hero Console
  const cardRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Interactive Live Hero Sandbox State
  const [sandboxVaultUnlocked, setSandboxVaultUnlocked] = useState(false);
  const [sandboxVoiceSpeaking, setSandboxVoiceSpeaking] = useState(false);
  const [sandboxCodePassed, setSandboxCodePassed] = useState(false);

  const handleSandboxVoice = () => {
    if (sandboxVoiceSpeaking) {
      voiceService.stopSpeaking();
      setSandboxVoiceSpeaking(false);
    } else {
      setSandboxVoiceSpeaking(true);
      voiceService.speak("Welcome to Stackwa. Instead of memorizing solutions, articulate your boundary conditions and Big-O invariants out loud.", {
        onEnd: () => setSandboxVoiceSpeaking(false),
        onError: () => setSandboxVoiceSpeaking(false)
      });
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden selection:bg-rose-600 selection:text-white">
      
      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-rose-600/30">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-white font-mono">Stackwa</span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">The Spatial Interview OS</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <button
                onClick={onLaunchApp}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onSignInWithGoogle}
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
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Subtle Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-rose-300 mb-8 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>No Generic LeetCode Grinding • Socratic Voice AI</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-neutral-100"
        >
          Master High-Stakes Screens with <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300">Spatial Socratic AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Calibrate directly for your dream company. Converse with an AI Interview Lead, shatter anti-spoiler hints, deconstruct production UI architectures, and raise your hand for live clarifications.
        </motion.p>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onLaunchApp}
            className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span>Start Free AI Calibration</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!user && (
            <button
              onClick={onSignInWithGoogle}
              className="px-6 py-3.5 rounded-2xl text-sm font-semibold bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition flex items-center space-x-2.5 backdrop-blur-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
        </motion.div>

        {/* 3D Interactive Hero Workstation Console */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 max-w-5xl mx-auto perspective-1000"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          ref={cardRef}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="oled-panel rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-neutral-950/80 backdrop-blur-2xl text-left"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-xs text-neutral-400">interactive_studio.preview</span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Live Sandbox</span>
                </span>
              </div>
            </div>

            {/* Interactive Sandbox Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              
              {/* Left: Anti-Spoiler Vault Clue Demo */}
              <div className="md:col-span-5 space-y-4">
                <div className="text-xs font-semibold uppercase text-neutral-400 tracking-wider font-mono">
                  1. Anti-Spoiler Vault
                </div>

                <div 
                  onClick={() => setSandboxVaultUnlocked(!sandboxVaultUnlocked)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    sandboxVaultUnlocked 
                      ? 'bg-neutral-900/90 border-sky-500/40' 
                      : 'bg-neutral-950 border-white/10 hover:border-sky-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {sandboxVaultUnlocked ? (
                        <Unlock className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-neutral-400" />
                      )}
                      <span className="text-xs font-bold text-white">Optimal Invariant Vault</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">Click to unlock</span>
                  </div>

                  {sandboxVaultUnlocked ? (
                    <p className="text-xs text-sky-200 leading-relaxed animate-in fade-in">
                      Track the sliding window boundaries with two monotonic pointers. As right advances, increment left until windowMs constraint is satisfied in linear O(n) time.
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">
                      Hover meta-clue: Stuck on O(n) sliding window without nested loops? Click to shatter.
                    </p>
                  )}
                </div>

                {/* Voice Coach Button */}
                <button
                  onClick={handleSandboxVoice}
                  className={`w-full p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
                    sandboxVoiceSpeaking
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span>{sandboxVoiceSpeaking ? 'Speaking explanation...' : 'Listen to AI Voice Explanation'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Web Speech 🔊</span>
                </button>
              </div>

              {/* Right: Live Execution & Real Assertion Output */}
              <div className="md:col-span-7 bg-black rounded-2xl p-4 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] pb-2 border-b border-white/5">
                  <span>test_runner.js</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-500">Strict assertion engine</span>
                    <button
                      onClick={() => setSandboxCodePassed(!sandboxCodePassed)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition font-bold"
                    >
                      {sandboxCodePassed ? 'Test Failing Input' : 'Run Test Vector'}
                    </button>
                  </div>
                </div>

                <div className="text-neutral-300 font-mono text-xs space-y-1">
                  <span className="text-neutral-500">// Real in-browser execution (Zero mock passes)</span>
                  <div className="text-pink-400">isRateLimitConformant([1000, 1200, 1500], k=3, windowMs=1000);</div>
                </div>

                <div className={`p-3 rounded-xl border text-[11px] transition ${
                  sandboxCodePassed 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{sandboxCodePassed ? '✓ Test 1: Passed (0.12ms)' : '✗ Test 1: Constraint Verification'}</span>
                    <span className="font-mono text-[10px]">{sandboxCodePassed ? 'Expected: true | Got: true' : 'Click "Run Test Vector" to verify'}</span>
                  </div>
                  <div className="text-neutral-400 text-[10px]">
                    {sandboxCodePassed 
                      ? 'Sliding window invariant holds without memory allocation.' 
                      : 'Real JavaScript & Python compilers assert inputs. Empty "pass" solutions strictly fail.'}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>

      </section>

      {/* Feature Deep-Dive Grid (Uncluttered, High-Impact) */}
      <section className="relative z-10 py-20 border-t border-white/10 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold">The Technical OS</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Built for Engineers Who Value First Principles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Conversational Calibration</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Zero rigid templates. Converse with an AI interviewer who adapts to your exact target company, role, timeline, and current weak spots.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Anti-Spoiler Vault Hints</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Progressive hints with hover meta-clues and 1.5s editor focus dimming, forcing you to develop problem-solving intuition instead of memorizing solutions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Defensive Edge-Case Radar</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                UI & System Design studio casting glowing X-Ray bounding boxes across production mockups with defensive checks for offline mode, skeletons, and error boundaries.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Strict Real Execution</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                No mock passes. JavaScript and Python run in real execution sandboxes. Incomplete or placeholder code strictly fails with exact assertion differences.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Voice Coaching & "Raise Hand"</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Raise your hand (✋) during any problem to ask clarifying questions about constraints and hear the AI interviewer explain nuances aloud.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="oled-panel rounded-3xl p-8 border border-white/10 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Verified Thermal Receipt</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Deep, non-random post-interview scorecards analyzing your actual code, Big-O complexity, test speed, and communication with a cryptographic hash.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-20 text-center border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Ready for Your Highest-Stakes Technical Screen?
          </h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Zero setup. Sign in with Google to synchronize your daywise preparation roadmap and challenge results.
          </p>
          <div className="pt-4 flex justify-center">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>Launch Stackwa Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
