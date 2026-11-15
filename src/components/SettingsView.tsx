import React, { useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Info,
  Code2,
  Mic
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserInterviewProfile } from '../types';
import { type User } from 'firebase/auth';

interface SettingsViewProps {
  user: User | null;
  profile: UserInterviewProfile | null;
  onUpdateProfile?: (profile: UserInterviewProfile) => void;
  onClearData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  onClearData
}) => {
  // Audio & Socratic Voice Preferences
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('stackwa_sound_enabled') !== 'false'
  );
  const [speechRate, setSpeechRate] = useState<number>(
    Number(localStorage.getItem('stackwa_speech_rate')) || 1.0
  );
  const [voiceTone, setVoiceTone] = useState<'supportive' | 'strict'>(
    (localStorage.getItem('stackwa_voice_tone') as any) || 'supportive'
  );

  // Motion & VFX Physics Preferences
  const [springStiffness, setSpringStiffness] = useState(
    Number(localStorage.getItem('stackwa_spring_stiffness')) || 300
  );
  const [springDamping, setSpringDamping] = useState(
    Number(localStorage.getItem('stackwa_spring_damping')) || 25
  );
  const [glowIntensity, setGlowIntensity] = useState<'subtle' | 'high-contrast'>(
    (localStorage.getItem('stackwa_glow_intensity') as any) || 'high-contrast'
  );

  // Workspace & Editor Preferences
  const [tabSpacing, setTabSpacing] = useState<number>(
    Number(localStorage.getItem('stackwa_tab_spacing')) || 2
  );
  const [autoCloseBrackets, setAutoCloseBrackets] = useState(
    localStorage.getItem('stackwa_auto_close_brackets') !== 'false'
  );

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const handleSaveSettings = () => {
    localStorage.setItem('stackwa_sound_enabled', String(soundEnabled));
    localStorage.setItem('stackwa_speech_rate', String(speechRate));
    localStorage.setItem('stackwa_voice_tone', voiceTone);
    localStorage.setItem('stackwa_spring_stiffness', String(springStiffness));
    localStorage.setItem('stackwa_spring_damping', String(springDamping));
    localStorage.setItem('stackwa_glow_intensity', glowIntensity);
    localStorage.setItem('stackwa_tab_spacing', String(tabSpacing));
    localStorage.setItem('stackwa_auto_close_brackets', String(autoCloseBrackets));

    setSavedNotification('All preferences saved to local configuration!');
    setTimeout(() => setSavedNotification(null), 3000);
  };

  const handleExportData = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : 'anonymous',
      profile,
      solvedProblemIds: JSON.parse(localStorage.getItem('stackwa_solved_problems') || '[]'),
      completedFlowIds: JSON.parse(localStorage.getItem('stackwa_completed_flows') || '[]'),
      userGoals: JSON.parse(localStorage.getItem('stackwa_user_goals') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stackwa-interview-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            SYSTEM PREFERENCES
          </span>
          <span className="text-xs text-neutral-400 font-mono">v2.4.0 Studio</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Preferences & Workspace</h1>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
          Customize your Socratic AI voice persona, motion spring physics, code editor settings, and interview data calibration.
        </p>
      </div>

      {savedNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedNotification}</span>
        </motion.div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Audio & Socratic Voice Synthesis */}
        <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Audio & Speech Synthesis</h2>
              <p className="text-[11px] text-neutral-400">Socratic AI Voice & Sound Effects</p>
            </div>
          </div>

          {/* Sound & Speech Synthesizer Toggle */}
          <div className="p-3 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">Socratic Audio Feedback</div>
                <div className="text-[10px] text-neutral-400">Hear the AI lead ask clarifying questions aloud</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                soundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' 
                  : 'bg-white/5 text-neutral-400 border border-white/10'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300">Speech Rate:</span>
              <span className="text-rose-400 font-bold">{speechRate}x</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.9, 1.0, 1.1, 1.25].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`py-1.5 rounded-xl border text-xs font-mono transition ${
                    speechRate === rate
                      ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Socratic Lead Persona Tone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Interviewer Demeanor</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVoiceTone('supportive')}
                className={`p-3 rounded-xl border text-xs font-mono transition text-left ${
                  voiceTone === 'supportive'
                    ? 'border-rose-500 bg-rose-500/10 text-white'
                    : 'border-white/5 bg-black/40 text-neutral-400'
                }`}
              >
                <div className="font-bold text-rose-300">Staff Engineer</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Socratic & collaborative</div>
              </button>

              <button
                type="button"
                onClick={() => setVoiceTone('strict')}
                className={`p-3 rounded-xl border text-xs font-mono transition text-left ${
                  voiceTone === 'strict'
                    ? 'border-rose-500 bg-rose-500/10 text-white'
                    : 'border-white/5 bg-black/40 text-neutral-400'
                }`}
              >
                <div className="font-bold text-rose-300">Hiring Committee</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Rigorous edge-case defense</div>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Motion Graphics & VFX Tuning */}
        <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Motion & Kinetic Identity</h2>
              <p className="text-[11px] text-neutral-400">Framer Motion Spring Physics</p>
            </div>
          </div>

          {/* Spring Stiffness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300">Spring Stiffness:</span>
              <span className="text-rose-400 font-bold">{springStiffness}</span>
            </div>
            <input
              type="range"
              min="150"
              max="500"
              step="25"
              value={springStiffness}
              onChange={(e) => setSpringStiffness(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 font-mono">Recommended: 300 for tactile snappy snaps.</p>
          </div>

          {/* Spring Damping */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300">Spring Damping:</span>
              <span className="text-rose-400 font-bold">{springDamping}</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="5"
              value={springDamping}
              onChange={(e) => setSpringDamping(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 font-mono">Recommended: 25 to prevent overshooting bounce.</p>
          </div>

          {/* OLED Deep Red Contrast */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-neutral-300">OLED Palette Contrast</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGlowIntensity('high-contrast')}
                className={`p-3 rounded-xl border text-xs font-mono transition text-left ${
                  glowIntensity === 'high-contrast'
                    ? 'border-rose-500 bg-rose-500/10 text-white'
                    : 'border-white/10 bg-black/40 text-neutral-400'
                }`}
              >
                <div className="font-bold text-rose-400">Deep Crimson (#DC2626)</div>
                <div className="text-[10px] text-neutral-400 mt-1">High-contrast OLED black</div>
              </button>

              <button
                type="button"
                onClick={() => setGlowIntensity('subtle')}
                className={`p-3 rounded-xl border text-xs font-mono transition text-left ${
                  glowIntensity === 'subtle'
                    ? 'border-rose-500 bg-rose-500/10 text-white'
                    : 'border-white/10 bg-black/40 text-neutral-400'
                }`}
              >
                <div className="font-bold text-neutral-300">Subtle Ruby (#991B1B)</div>
                <div className="text-[10px] text-neutral-400 mt-1">Minimal diffused bloom</div>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Editor & Sandbox Preferences */}
      <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Editor & In-Browser Execution Sandbox</h2>
            <p className="text-[11px] text-neutral-400">Monaco Editor & Pyodide runtime defaults</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Indentation Tab Spacing</div>
              <div className="text-[10px] text-neutral-400">Number of spaces per indentation level</div>
            </div>
            <div className="flex space-x-1.5">
              {[2, 4].map(sp => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setTabSpacing(sp)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                    tabSpacing === sp
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sp} spaces
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Auto-Close Brackets & Quotes</div>
              <div className="text-[10px] text-neutral-400">Auto-insert matching pair characters</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoCloseBrackets(prev => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                autoCloseBrackets
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'bg-white/5 text-neutral-400 border border-white/10'
              }`}
            >
              {autoCloseBrackets ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Account, Calibration & Data Ownership */}
      <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Interview Calibration & Data Ownership</h2>
              <p className="text-[11px] text-neutral-400">Zero mock lock-in • Export or wipe anytime</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-neutral-400">Auth Status:</span>
            <span className="text-emerald-400 font-bold">
              {user && !user.isAnonymous ? 'Google Verified' : 'Local Session'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>Google Calendar Sync</span>
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Syncs your interview schedule to calculate actual days remaining dynamically.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 pt-1">
              {profile?.calendarConnected ? '✓ OAuth Link Active' : '○ Standalone Mode'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Export Interview Vaults</span>
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Download your full interview progress, solved invariants, and AI receipts as a JSON archive.
            </p>
            <button
              onClick={handleExportData}
              className="mt-1 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono transition"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
            <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset Local Workspace</span>
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Wipe locally cached goals and interview session state to re-calibrate from scratch.
            </p>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset your local interview goals and caches?")) {
                  localStorage.removeItem('stackwa_user_goals');
                  localStorage.removeItem('stackwa_user_profile');
                  localStorage.removeItem('stackwa_solved_problems');
                  if (onClearData) onClearData();
                  window.location.reload();
                }
              }}
              className="mt-1 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 text-xs font-mono transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset Goals</span>
            </button>
          </div>

        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono">
          <Info className="w-3.5 h-3.5" />
          <span>Config stored in browser localStorage with zero tracking cookies.</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveSettings}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </motion.button>
      </div>
    </div>
  );
};
