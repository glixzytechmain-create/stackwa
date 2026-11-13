import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Clock, 
  ExternalLink,
  Flame,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserInterviewProfile, DayPlan } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserInterviewProfile, roadmap: DayPlan[]) => void;
  initialProfile?: UserInterviewProfile | null;
}

const COMPANIES = ['Google', 'Meta', 'Stripe', 'Linear', 'Apple', 'Netflix', 'Amazon', 'Startup'];
const ROLES = ['Frontend Engineer', 'Fullstack Engineer', 'UI/Design Engineer', 'Systems Engineer'];
const SENIORITIES: ('Intern' | 'Junior' | 'Mid-Level' | 'Senior')[] = ['Intern', 'Junior', 'Mid-Level', 'Senior'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProfile
}) => {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState(initialProfile?.targetCompany || 'Linear');
  const [role, setRole] = useState(initialProfile?.role || 'Frontend Engineer');
  const [seniority, setSeniority] = useState<'Intern' | 'Junior' | 'Mid-Level' | 'Senior'>(initialProfile?.seniority || 'Junior');
  const [interviewDate, setInterviewDate] = useState(initialProfile?.interviewDate || '2026-11-20');
  const [daysRemaining, setDaysRemaining] = useState<number>(7);
  const [focusAreas, setFocusAreas] = useState<string[]>(['Greedy & Intervals', 'UI State Architecture', 'Accessibility & Edge Cases']);
  const [calendarSync, setCalendarSync] = useState(false);

  if (!isOpen) return null;

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleFinish = () => {
    // Generate tailored 7-day roadmap based on company and role
    const roadmap: DayPlan[] = [
      {
        dayNumber: 1,
        dateLabel: 'Day 1 — Foundation',
        theme: 'Greedy Single-Pass & Array Traversal',
        dsaProblemId: 'stock-price-maximizer',
        uiChallengeId: 'linear-command-palette',
        dailyRitual: 'Morning 20m: Articulate time complexity constraints out loud before writing a single line of code.',
        isCompleted: true
      },
      {
        dayNumber: 2,
        dateLabel: 'Day 2 — State Architecture',
        theme: 'Draft vs Global State Isolation & Modal Traps',
        dsaProblemId: 'merging-meeting-times',
        uiChallengeId: 'linear-command-palette',
        dailyRitual: 'Draw component state boundaries on paper before building React handlers.',
        isCompleted: false
      },
      {
        dayNumber: 3,
        dateLabel: 'Day 3 — Interval Synchronization',
        theme: 'Sorting & Overlapping Interval Condensation',
        dsaProblemId: 'merging-meeting-times',
        uiChallengeId: 'airbnb-filter-drawer',
        dailyRitual: 'Test edge cases where intervals touch back-to-back at the exact boundary.',
        isCompleted: false
      },
      {
        dayNumber: 4,
        dateLabel: 'Day 4 — Defensive UI Engineering',
        theme: 'Edge-Case Radar: Offline, Skeletons, and Errors',
        dsaProblemId: 'inflight-entertainment',
        uiChallengeId: 'airbnb-filter-drawer',
        dailyRitual: 'Verify that every filter change doesn\'t re-fetch unapplied server queries.',
        isCompleted: false
      },
      {
        dayNumber: 5,
        dateLabel: 'Day 5 — O(1) Hash Complements',
        theme: 'Complementary Matching & Set Lookups',
        dsaProblemId: 'inflight-entertainment',
        uiChallengeId: 'spotify-queue-drawer',
        dailyRitual: 'Guard against self-matching items before inserting into hash sets.',
        isCompleted: false
      },
      {
        dayNumber: 6,
        dateLabel: 'Day 6 — Persistent Audio Context',
        theme: 'Root Layout Mounting & Optimistic Queue Updates',
        dsaProblemId: 'stock-price-maximizer',
        uiChallengeId: 'spotify-queue-drawer',
        dailyRitual: 'Simulate network rollback scenarios during drag-and-drop reordering.',
        isCompleted: false
      },
      {
        dayNumber: 7,
        dateLabel: 'Day 7 — Mock Interview Dress Rehearsal',
        theme: 'Full FAANG Simulation & Behavioral Readiness',
        dsaProblemId: 'stock-price-maximizer',
        uiChallengeId: 'linear-command-palette',
        dailyRitual: 'Complete a full timed session with the Socratic AI Coach and export your receipt.',
        isCompleted: false
      }
    ];

    const profile: UserInterviewProfile = {
      targetCompany: company,
      role,
      seniority,
      interviewDate,
      daysRemaining,
      focusAreas,
      calendarConnected: calendarSync,
      onboardingCompleted: true
    };

    onComplete(profile, roadmap);
    onClose();
  };

  // Google Calendar Quick Sync URL (opens official Google Calendar event creation)
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Stackwa Interview Prep: ${company} (${role})`);
    const details = encodeURIComponent(`Daily Socratic practice on Stackwa.\nTarget: ${company}\nRole: ${role}\nFocus: ${focusAreas.join(', ')}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl oled-surface rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Subtle Brand Accent Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Personalized Calibration
            </span>
            <span className="text-xs text-neutral-400">Step {step} of 3</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {step === 1 && "What interview are you preparing for?"}
            {step === 2 && "Timeline & Focus Areas"}
            {step === 3 && "Calendar Sync & Daily Practice Rituals"}
          </h2>
          <p className="text-xs text-neutral-400">
            Stackwa tailors its Socratic questions, hint depth, and UI design challenges to modern 2026 hiring standards.
          </p>
        </div>

        {/* Step 1: Company, Role & Seniority */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Target Company</label>
              <div className="grid grid-cols-4 gap-2">
                {COMPANIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCompany(c)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                      company === c 
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20' 
                        : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Target Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition text-left border ${
                      role === r 
                        ? 'bg-white/10 text-white border-white/30' 
                        : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Seniority</label>
              <div className="grid grid-cols-4 gap-2">
                {SENIORITIES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeniority(s)}
                    className={`py-2 rounded-xl text-xs font-medium transition border ${
                      seniority === s 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' 
                        : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Date & Focus Areas */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-300">When is your interview?</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'In 7 Days', days: 7 },
                  { label: 'In 14 Days', days: 14 },
                  { label: 'In 30 Days', days: 30 }
                ].map(item => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setDaysRemaining(item.days);
                      const d = new Date();
                      d.setDate(d.getDate() + item.days);
                      setInterviewDate(d.toISOString().split('T')[0]);
                    }}
                    className={`py-3 rounded-xl text-xs font-semibold transition border flex flex-col items-center space-y-1 ${
                      daysRemaining === item.days 
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20' 
                        : 'bg-neutral-900/60 text-neutral-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Focus Areas to Prioritize</label>
              <div className="space-y-2">
                {[
                  'Greedy Algorithms & Arrays (Interview Cake)',
                  'Interval Merging & Overlap Bounds',
                  'Frontend UI State Architecture (Mobbin)',
                  'Defensive Edge Cases (Offline, Skeletons, Errors)',
                  'Big-O Complexity & Trade-off Articulation'
                ].map(area => {
                  const active = focusAreas.includes(area);
                  return (
                    <div
                      key={area}
                      onClick={() => toggleFocusArea(area)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        active 
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                          : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:border-white/10'
                      }`}
                    >
                      <span>{area}</span>
                      {active && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Calendar Sync & Ritual Preview */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                <Flame className="w-4 h-4" />
                <span>Your Daywise Practice Ritual</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Based on your target at <strong className="text-white">{company}</strong> ({role}), Stackwa will schedule a 30-minute daily ritual:
              </p>
              <ul className="text-xs text-neutral-400 space-y-1.5 pl-4 list-disc">
                <li><strong className="text-neutral-200">10m:</strong> Socratic hint vault breakdown without looking at solution code.</li>
                <li><strong className="text-neutral-200">10m:</strong> Mobbin X-Ray component mapping & state challenge.</li>
                <li><strong className="text-neutral-200">10m:</strong> Code execution against edge cases + live AI receipt.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Google Calendar Integration</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Optionally sync daily 30-min preparation reminders to your calendar.
                </p>
              </div>

              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setCalendarSync(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 transition flex items-center space-x-1"
              >
                <span>Add to Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition flex items-center space-x-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Custom Roadmap</span>
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
