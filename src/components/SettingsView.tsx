import React, { useState } from 'react';
import { 
  Key, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Info
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
  // Integrations state
  const [scrimbaKey, setScrimbaKey] = useState(
    localStorage.getItem('stackwa_scrimba_key') || 'scr_live_n7u06s8pb252l7dfutvs4brh'
  );
  const [anakinAppId, setAnakinAppId] = useState(
    localStorage.getItem('stackwa_anakin_app_id') || ''
  );
  const [anakinApiKey, setAnakinApiKey] = useState(
    localStorage.getItem('stackwa_anakin_api_key') || ''
  );
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('stackwa_sound_enabled') !== 'false'
  );
  const [springStiffness, setSpringStiffness] = useState(300);
  const [springDamping, setSpringDamping] = useState(25);
  const [glowIntensity, setGlowIntensity] = useState<'subtle' | 'high-contrast'>('high-contrast');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const handleSaveSettings = () => {
    localStorage.setItem('stackwa_scrimba_key', scrimbaKey);
    localStorage.setItem('stackwa_anakin_app_id', anakinAppId);
    localStorage.setItem('stackwa_anakin_api_key', anakinApiKey);
    localStorage.setItem('stackwa_sound_enabled', String(soundEnabled));
    localStorage.setItem('stackwa_spring_stiffness', String(springStiffness));
    localStorage.setItem('stackwa_spring_damping', String(springDamping));
    localStorage.setItem('stackwa_glow_intensity', glowIntensity);

    setSavedNotification('All settings & integration keys saved to local storage!');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            SYSTEM PREFERENCES
          </span>
          <span className="text-xs text-neutral-400 font-mono">v2.4.0 Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings & Integrations</h1>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
          Configure external ecosystem API keys, motion spring physics, audio feedback, and interview calibration data.
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
        
        {/* 1. Ecosystem API Keys */}
        <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ecosystem API Keys</h2>
              <p className="text-[11px] text-neutral-400">Scrimba, Anakin.ai, Gemini Studio</p>
            </div>
          </div>

          {/* Scrimba Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-neutral-200">Scrimba Live API Key</label>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
              </span>
            </div>
            <input
              type="text"
              value={scrimbaKey}
              onChange={(e) => setScrimbaKey(e.target.value)}
              placeholder="scr_live_..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none transition"
            />
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between font-mono">
                <span className="text-neutral-400">Live Quota Usage:</span>
                <span className="text-rose-400 font-bold">5 of 5 Daily Codecasts</span>
              </div>
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                Refreshes every 24 hours. The codecast stepper continues running indefinitely in offline interactive mode once loaded.
              </p>
            </div>
          </div>

          {/* Anakin.ai App ID */}
          <div className="space-y-2">
            <label className="font-semibold text-xs text-neutral-200">Anakin.ai App ID (Optional)</label>
            <input
              type="text"
              value={anakinAppId}
              onChange={(e) => setAnakinAppId(e.target.value)}
              placeholder="e.g. app_893274923"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none transition"
            />
          </div>

          {/* Anakin.ai API Key */}
          <div className="space-y-2">
            <label className="font-semibold text-xs text-neutral-200">Anakin.ai API Key (Optional)</label>
            <input
              type="password"
              value={anakinApiKey}
              onChange={(e) => setAnakinApiKey(e.target.value)}
              placeholder="anakin_live_..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none transition"
            />
          </div>
        </div>

        {/* 2. Motion Graphics & VFX Tuning */}
        <div className="oled-panel rounded-3xl p-6 border border-white/10 bg-neutral-950/80 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Motion & VFX Physics</h2>
              <p className="text-[11px] text-neutral-400">Framer Motion Kinetic Identity</p>
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
            <label className="text-xs font-semibold text-neutral-300">OLED Deep Glow Palette</label>
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

          {/* Sound & Speech Synthesizer */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <span className="text-xs text-neutral-300">Socratic Audio Feedback</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                soundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-white/5 text-neutral-400 border border-white/10'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

      </div>

      {/* 3. Account, Calibration & Cloud Data */}
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
