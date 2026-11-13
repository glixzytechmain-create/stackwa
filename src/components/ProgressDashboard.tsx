import React from 'react';
import { 
  Flame, 
  Code2, 
  Layers, 
  Cloud, 
  ExternalLink,
  Target,
  ArrowRight
} from 'lucide-react';
import { TabType } from '../types';

interface ProgressDashboardProps {
  solvedCount: number;
  totalProblems: number;
  completedFlowsCount: number;
  totalFlows: number;
  streakDays: number;
  setActiveTab: (tab: TabType) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  solvedCount,
  totalProblems,
  completedFlowsCount,
  totalFlows,
  streakDays,
  setActiveTab
}) => {
  const dsaPercent = Math.round((solvedCount / totalProblems) * 100);
  const uiPercent = Math.round((completedFlowsCount / totalFlows) * 100);
  const overallReadiness = Math.round((dsaPercent + uiPercent) / 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-purple-950/20">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Live Candidate Dashboard
            </span>
            <span className="text-xs text-slate-400">Synced to Cloud Firestore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Your Technical Interview Readiness
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Stackwa combines algorithmic problem-solving with real-world UI system design so you can excel at both LeetCode rounds and frontend architecture screens.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1: Overall Readiness */}
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Readiness Score</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{overallReadiness}%</div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${overallReadiness}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">Balanced across DSA & UI Design</span>
        </div>

        {/* Metric 2: DSA Problems */}
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Interview Cake DSA</span>
            <Code2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{solvedCount} / {totalProblems}</div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dsaPercent}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">{dsaPercent}% algorithm curriculum completed</span>
        </div>

        {/* Metric 3: UI System Designs */}
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mobbin UI Flows</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{completedFlowsCount} / {totalFlows}</div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${uiPercent}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">{uiPercent}% frontend system architecture mastered</span>
        </div>

        {/* Metric 4: Daily Streak */}
        <div className="glass-panel rounded-2xl p-6 border border-orange-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{streakDays} Days</div>
          <div className="mt-3 flex items-center space-x-1">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div 
                key={d} 
                className={`flex-1 h-1.5 rounded-full ${
                  d <= streakDays ? 'bg-orange-500' : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>
          <span className="text-[11px] text-orange-400 mt-2 block">Keep the momentum going!</span>
        </div>

      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Jump into DSA */}
        <div 
          onClick={() => setActiveTab('dsa')}
          className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Continue DSA Challenges</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Practice greedy algorithms, hash maps, and interval merging with progressive Interview Cake hints and Scrimba video explainers.
          </p>
          <span className="text-xs font-semibold text-indigo-400 flex items-center space-x-1">
            <span>Open DSA Arena</span>
            <span>&rarr;</span>
          </span>
        </div>

        {/* Card 2: Jump into Mobbin UI Design */}
        <div 
          onClick={() => setActiveTab('ui-design')}
          className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Explore Mobbin UI System Design</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Master real-world frontend architecture: Linear's command palette, Airbnb's filter drawer, and Spotify's audio queue.
          </p>
          <span className="text-xs font-semibold text-purple-400 flex items-center space-x-1">
            <span>Open UI Design Studio</span>
            <span>&rarr;</span>
          </span>
        </div>

      </div>

      {/* Cloud & Hosting Footer Details */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <Cloud className="w-4 h-4 text-blue-400" />
          <span>Backend: <strong className="text-white">Cloud Firestore</strong> (Project: <code className="text-indigo-300">stackwa</code>)</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>Deployment Platform: <strong className="text-white">DeployXA</strong> Cloud Containers</span>
          <a 
            href="https://github.com/glixzytechmain-create/stackwa" 
            target="_blank" 
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

    </div>
  );
};
