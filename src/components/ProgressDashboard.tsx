import React from 'react';
import { 
  Flame, 
  Code2, 
  Layers, 
  ExternalLink,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TabType, UserInterviewProfile } from '../types';
import { SpotlightCard } from './SpotlightCard';

interface ProgressDashboardProps {
  solvedCount: number;
  totalProblems: number;
  completedFlowsCount: number;
  totalFlows: number;
  streakDays: number;
  profile?: UserInterviewProfile | null;
  setActiveTab: (tab: TabType) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  solvedCount,
  totalProblems,
  completedFlowsCount,
  totalFlows,
  streakDays,
  profile,
  setActiveTab
}) => {
  const dsaPercent = Math.round((solvedCount / totalProblems) * 100);
  const uiPercent = Math.round((completedFlowsCount / totalFlows) * 100);
  const overallReadiness = Math.round((dsaPercent + uiPercent) / 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.22)" className="p-8 border border-white/10 bg-neutral-950/80">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-semibold">
              Live Candidate Telemetry
            </span>
            <span className="text-xs text-neutral-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Invariant Tracking</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Technical Interview Readiness Matrix
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Stackwa synchronizes high-performance algorithmic invariants with full-stack UI architecture. Track your diagnostic progress, master edge-case handling, and rehearse with Socratic AI feedback.
          </p>
        </div>
      </SpotlightCard>

      {/* Metrics Row with Spotlight Effect */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1: Overall Readiness */}
        <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.25)" className="p-6">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Readiness Score</span>
            <Target className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{overallReadiness}%</div>
          <div className="mt-3 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500" 
              style={{ width: `${overallReadiness}%` }} 
            />
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 block">Balanced across DSA & UI Architecture</span>
        </SpotlightCard>

        {/* Metric 2: DSA Problems */}
        <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.2)" className="p-6">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Algorithms Mastered</span>
            <Code2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{solvedCount} / {totalProblems}</div>
          <div className="mt-3 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
              style={{ width: `${dsaPercent}%` }} 
            />
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 block">{dsaPercent}% algorithmic curriculum verified</span>
        </SpotlightCard>

        {/* Metric 3: UI System Designs */}
        <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.2)" className="p-6">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">UI Architecture Flows</span>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{completedFlowsCount} / {totalFlows}</div>
          <div className="mt-3 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
              style={{ width: `${uiPercent}%` }} 
            />
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 block">{uiPercent}% production systems designed</span>
        </SpotlightCard>

        {/* Metric 4: Daily Streak */}
        <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.2)" className="p-6">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Practice Streak</span>
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{streakDays} Days</div>
          <div className="mt-3 flex items-center space-x-1">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div 
                key={d} 
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  d <= streakDays ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-neutral-800'
                }`} 
              />
            ))}
          </div>
          <span className="text-[11px] text-rose-400 mt-2 block font-medium">Cadence active — keep momentum</span>
        </SpotlightCard>

      </div>

      {/* Quick Launch Track Selectors with Magnetic Cursor Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Track 1: Jump into DSA */}
        <SpotlightCard 
          spotlightColor="rgba(220, 38, 38, 0.25)" 
          onClick={() => setActiveTab('dsa')}
          className="p-7 cursor-pointer group hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Code2 className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 group-hover:translate-x-1.5 transition-transform duration-200" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Algorithmic Problem Solving</h3>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            Execute real code against strict automated test assertions. Master sliding windows, mutex states, and LRU caches with kinetic typing sparks and 3D anti-spoiler hints.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1">
              <span>Open DSA Arena</span>
              <span>&rarr;</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Live WASM / JS Sandbox</span>
          </div>
        </SpotlightCard>

        {/* Track 2: Jump into Interactive Interview Tracks */}
        <SpotlightCard 
          spotlightColor="rgba(220, 38, 38, 0.25)" 
          onClick={() => setActiveTab('dsa')}
          className="p-7 cursor-pointer group hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Layers className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 group-hover:translate-x-1.5 transition-transform duration-200" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Interactive Interview Tracks</h3>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            3D flippable cards with calibrated company screens, interactive UI sandboxes, Architecture MCQs, and mid-question Socratic agent steering.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1">
              <span>Enter Interview Screen</span>
              <span>&rarr;</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Live UI Sandbox & Generative UI</span>
          </div>
        </SpotlightCard>

      </div>

      {/* Rehearsal Test History & Performance Records */}
      <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.2)" className="p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Rehearsal Test History & Profile Telemetry
              </h3>
              <p className="text-xs text-neutral-400">
                Audited test batches recorded during live company coding rehearsals
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300">
            {profile?.testHistory?.length || 0} Sessions Recorded
          </span>
        </div>

        {profile?.testHistory && profile.testHistory.length > 0 ? (
          <div className="space-y-3">
            {profile.testHistory.slice(-5).reverse().map((record) => (
              <div 
                key={record.id} 
                className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{record.company}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {record.role}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 uppercase">
                      {record.mode} • Batch #{record.batchNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{new Date(record.completedAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>{Math.floor(record.durationSeconds / 60)}m {record.durationSeconds % 60}s</span>
                    </span>
                    {record.questionTitles && record.questionTitles.length > 0 && (
                      <span className="text-neutral-500 truncate max-w-xs">
                        Topics: {record.questionTitles.slice(0, 2).join(', ')}{record.questionTitles.length > 2 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase">Solved</div>
                    <div className="font-bold text-white text-sm">
                      {record.solvedQuestions} / {record.totalQuestions}
                    </div>
                  </div>
                  <div className="text-right pl-3 border-l border-white/10">
                    <div className="text-[10px] text-neutral-500 uppercase">Score</div>
                    <div className={`font-black text-base ${
                      record.scorePercentage >= 80 
                        ? 'text-emerald-400' 
                        : record.scorePercentage >= 50 
                        ? 'text-amber-400' 
                        : 'text-rose-400'
                    }`}>
                      {record.scorePercentage}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-black/40 border border-white/5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-400 font-mono">
              No completed rehearsal test batches recorded yet.
            </p>
            <p className="text-[11px] text-neutral-500">
              Start a Round 1 Rehearsal session for any target company and click <strong>Submit Test</strong> to track your permanent performance telemetry.
            </p>
          </div>
        )}
      </SpotlightCard>

      {/* System Integrity & Fast Actions Bar */}
      <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.15)" className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Telemetry: <strong className="text-white">Active Session</strong> (Zero Mock Data • Verified Execution)</span>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setActiveTab('roadmap')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 transition text-xs font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>View Daywise Roadmap</span>
            </motion.button>

            <a 
              href="https://github.com/glixzytechmain-create/stackwa" 
              target="_blank" 
              rel="noreferrer"
              className="text-neutral-400 hover:text-white flex items-center space-x-1 font-mono text-[11px] transition"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </SpotlightCard>

    </div>
  );
};
