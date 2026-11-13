import React from 'react';
import { Award, Sparkles, CheckCircle2 } from 'lucide-react';

export const SponsorBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/10 py-2.5 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <Award className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">IceHacks Multi-Sponsor Architecture:</span>
          <span className="hidden sm:inline text-slate-400">Integrated developer APIs & pedagogical frameworks</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interview Cake */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">Interview Cake</span>
            <span className="text-[10px] text-amber-400/80">(DSA Hints)</span>
          </div>

          {/* Mobbin */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <CheckCircle2 className="w-3 h-3 text-purple-400" />
            <span className="font-semibold">Mobbin</span>
            <span className="text-[10px] text-purple-400/80">(UI System Design)</span>
          </div>

          {/* Scrimba */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-300">
            <CheckCircle2 className="w-3 h-3 text-pink-400" />
            <span className="font-semibold">Scrimba</span>
            <span className="text-[10px] text-pink-400/80">(Codecast Embeds)</span>
          </div>

          {/* DeployXA */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span className="font-semibold">DeployXA</span>
            <span className="text-[10px] text-blue-400/80">(Cloud Hosting)</span>
          </div>

          {/* Firebase */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-300">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="font-semibold">Firebase</span>
            <span className="text-[10px] text-orange-400/80">(Auth & Firestore)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
