import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Code2, 
  Layers, 
  Clock,
  Settings
} from 'lucide-react';
import { UserInterviewProfile, DayPlan, TabType } from '../types';

interface RoadmapViewProps {
  profile: UserInterviewProfile | null;
  roadmap: DayPlan[];
  onToggleDay: (dayNumber: number) => void;
  onOpenSettings: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  profile,
  roadmap,
  onToggleDay,
  onOpenSettings,
  setActiveTab
}) => {
  const completedCount = roadmap.filter(d => d.isCompleted).length;
  const progressPercent = Math.round((completedCount / (roadmap.length || 1)) * 100);

  const getDayGoogleCalendarUrl = (day: DayPlan) => {
    const title = encodeURIComponent(`Stackwa Prep Day ${day.dayNumber}: ${day.theme}`);
    const details = encodeURIComponent(`Ritual: ${day.dailyRitual}\nTarget Company: ${profile?.targetCompany || 'Tech Company'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="oled-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Personalized Daywise Roadmap
            </span>
            <span className="text-xs text-neutral-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Interview in {profile?.daysRemaining || 7} Days</span>
            </span>
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition flex items-center space-x-1"
            >
              <Settings className="w-3 h-3" />
              <span>Edit Goal</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {profile?.targetCompany || 'Linear'} — {profile?.role || 'Frontend Engineer'} Interview Track
          </h1>

          <p className="text-sm text-neutral-300 leading-relaxed">
            Curated daily rituals combining <strong>Interview Cake DSA</strong>, <strong>Mobbin UI Architecture</strong>, and <strong>Socratic AI Coaching</strong> aligned with 2026 hiring benchmarks.
          </p>

          <div className="pt-2 flex items-center space-x-4 text-xs text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>{completedCount} of {roadmap.length} Days Completed ({progressPercent}%)</span>
            </div>
            <div className="w-36 h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Day Cards Timeline */}
      <div className="space-y-4">
        {roadmap.map((day) => (
          <div 
            key={day.dayNumber}
            className={`oled-panel rounded-2xl p-6 border transition-all duration-200 ${
              day.isCompleted 
                ? 'border-emerald-500/30 bg-emerald-950/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Column: Day & Details */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => onToggleDay(day.dayNumber)}
                    className="flex items-center space-x-2 text-xs font-bold transition"
                  >
                    {day.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-600 hover:text-white" />
                    )}
                    <span className="text-white font-mono">{day.dateLabel}</span>
                  </button>

                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                    {day.theme}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-xs text-neutral-300">
                  <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px]">Daily Practice Ritual: </span>
                  <span>{day.dailyRitual}</span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('dsa')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 transition flex items-center space-x-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>DSA Vault</span>
                </button>

                <button
                  onClick={() => setActiveTab('ui-design')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition flex items-center space-x-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mobbin X-Ray</span>
                </button>

                <a
                  href={getDayGoogleCalendarUrl(day)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition"
                  title="Schedule 30m block on Google Calendar"
                >
                  <Calendar className="w-4 h-4 text-sky-400" />
                </a>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
