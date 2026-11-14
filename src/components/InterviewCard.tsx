import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  ArrowRight, 
  RotateCw, 
  Code2, 
  Zap,
  Bot,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export type GoalSectionTab = 'rehearsal' | 'roadmap' | 'coach' | 'readiness';

export interface InterviewTrack {
  id: string;
  company: string;
  role: string;
  dateLabel: string;
  daysRemaining?: number;
  intensity: '15m' | '30m' | '45m';
  difficulty: 'Medium' | 'Hard' | 'FAANG-Caliber';
  focusTopics: string[];
  roundsCount: number;
  completedRounds: number;
  readinessScore: number;
  accentColor: string;
}

interface InterviewCardProps {
  track: InterviewTrack;
  onEnter: (track: InterviewTrack, initialTab?: GoalSectionTab) => void;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({ track, onEnter }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative h-[340px] w-full perspective-1000 select-none group">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* ================= FRONT FACE ================= */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 rounded-3xl p-6 bg-neutral-950/90 border border-white/10 hover:border-rose-500/40 shadow-xl backdrop-blur-md flex flex-col justify-between transition-colors"
        >
          {/* Top Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight">{track.company}</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">{track.role}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                {track.difficulty}
              </span>
            </div>

            {/* Date & Time Meta */}
            <div className="flex items-center space-x-3 text-xs text-neutral-400 font-mono pt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>{track.dateLabel}</span>
              </div>
              {track.daysRemaining !== undefined && (
                <span className="text-rose-400 font-bold">({track.daysRemaining}d left)</span>
              )}
              <div className="flex items-center space-x-1 text-neutral-400">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{track.intensity} Screen</span>
              </div>
            </div>

            {/* Focus Topics Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {track.focusTopics.map((topic, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5 font-mono">
                  {topic}
                </span>
              ))}
            </div>

            {/* Dedicated Company Card Quick Nav: Roadmap, Coach, Readiness */}
            <div className="pt-2 flex items-center space-x-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter(track, 'roadmap');
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-[10px] text-neutral-300 font-mono transition"
                title={`Open ${track.company} Syllabus Roadmap`}
              >
                <Calendar className="w-3 h-3 text-rose-400" />
                <span>Roadmap</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter(track, 'coach');
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-[10px] text-neutral-300 font-mono transition"
                title={`Open ${track.company} Voice AI Coach`}
              >
                <Bot className="w-3 h-3 text-sky-400" />
                <span>AI Coach</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter(track, 'readiness');
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-[10px] text-neutral-300 font-mono transition"
                title={`Open ${track.company} Readiness Radar`}
              >
                <BarChart3 className="w-3 h-3 text-emerald-400" />
                <span>Readiness</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setIsFlipped(true)}
              className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white transition font-mono"
            >
              <RotateCw className="w-3.5 h-3.5 text-rose-400" />
              <span>Flip Details</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => onEnter(track, 'rehearsal')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              <span>Enter Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* ================= BACK FACE ================= */}
        <div 
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)' 
          }}
          className="absolute inset-0 rounded-3xl p-6 bg-neutral-900 border border-rose-500/40 shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold tracking-wider">Curriculum Syllabus</span>
                <h4 className="font-bold text-sm text-white">{track.company} Workspace</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {track.completedRounds} / {track.roundsCount} Rounds Done
              </span>
            </div>

            {/* Rounds & Features List */}
            <div className="space-y-2 pt-2.5 text-xs">
              <div 
                onClick={() => onEnter(track, 'rehearsal')}
                className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 cursor-pointer text-neutral-200 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>Round 1:</strong> 4-Stage Live Screen Rehearsal</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
              </div>

              <div 
                onClick={() => onEnter(track, 'roadmap')}
                className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 cursor-pointer text-neutral-200 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>Plan:</strong> Day-by-Day Company Syllabus</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
              </div>

              <div 
                onClick={() => onEnter(track, 'coach')}
                className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 cursor-pointer text-neutral-200 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <span><strong>AI Lead:</strong> Voice Mock Interviewer</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
              </div>

              <div 
                onClick={() => onEnter(track, 'readiness')}
                className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 cursor-pointer text-neutral-200 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>Target:</strong> Readiness Radar & Scorecard</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setIsFlipped(false)}
              className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white transition font-mono"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => onEnter(track, 'rehearsal')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Screen Now</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
