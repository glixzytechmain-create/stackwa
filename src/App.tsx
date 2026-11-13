import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SpatialCanvas } from './components/SpatialCanvas';
import { ClickRippleEffect } from './components/ClickRippleEffect';
import { DsaArena } from './components/DsaArena';
import { AiMockRoom } from './components/AiMockRoom';
import { ProgressDashboard } from './components/ProgressDashboard';
import { RoadmapView } from './components/RoadmapView';
import { OnboardingModal } from './components/OnboardingModal';
import { FloatingAiPill } from './components/FloatingAiPill';
import { InterviewCard, InterviewTrack } from './components/InterviewCard';
import { InterviewEnvironment } from './components/InterviewEnvironment';
import { Building2, Sparkles, Code2 } from 'lucide-react';
import { TabType, UserInterviewProfile, DayPlan, DsaProblem } from './types';
import { DSA_PROBLEMS } from './data/dsaProblems';
import { UI_CHALLENGES } from './data/uiFlows';
import { 
  subscribeToAuth, 
  loadUserProgress, 
  saveUserProgress,
  loginWithGoogle
} from './firebase';
import { type User } from 'firebase/auth';

const DEFAULT_VISITOR_PROFILE: UserInterviewProfile = {
  targetCompany: 'General Engineering Practice',
  role: 'Full-Stack / Systems Engineer',
  seniority: 'Mid-Level',
  interviewDate: '',
  daysRemaining: 0,
  focusAreas: ['Distributed Rate Limiting', 'Transactional State Machines', 'LRU O(1) Eviction Pipeline'],
  calendarConnected: false,
  onboardingCompleted: false,
  isGeneralPractice: true
};

const DEFAULT_ROADMAP: DayPlan[] = [
  {
    dayNumber: 1,
    dateLabel: 'Day 1 — Diagnostic & Invariants',
    theme: 'Sliding Window Request Arbiter & Monotonic Bounds',
    dsaProblemId: 'distributed-rate-limiter',
    uiChallengeId: 'linear-command-palette',
    dailyRitual: 'Morning 20m: Articulate Big-O time and space complexity out loud before writing a single line of code.',
    isCompleted: true
  },
  {
    dayNumber: 2,
    dateLabel: 'Day 2 — State Architecture',
    theme: 'Draft vs Global State Isolation & Mutex Handling',
    dsaProblemId: 'idempotent-transaction-ledger',
    uiChallengeId: 'linear-command-palette',
    dailyRitual: 'Map component state boundaries on paper before writing React reducers.',
    isCompleted: false
  },
  {
    dayNumber: 3,
    dateLabel: 'Day 3 — Interval Synchronization',
    theme: 'High-Concurrency Ledger Windows & Conflict Detection',
    dsaProblemId: 'idempotent-transaction-ledger',
    uiChallengeId: 'airbnb-filter-drawer',
    dailyRitual: 'Test boundary conditions where intervals touch at the exact millisecond mark.',
    isCompleted: false
  },
  {
    dayNumber: 4,
    dateLabel: 'Day 4 — Defensive Engineering',
    theme: 'Edge-Case Radar: Offline Queueing & Error Boundaries',
    dsaProblemId: 'lru-cache-eviction',
    uiChallengeId: 'airbnb-filter-drawer',
    dailyRitual: 'Confirm filter state changes do not issue cascading network re-fetches.',
    isCompleted: false
  },
  {
    dayNumber: 5,
    dateLabel: 'Day 5 — O(1) Eviction Pipelines',
    theme: 'LRU Double-Linked List & Hash Map Priority Refresh',
    dsaProblemId: 'lru-cache-eviction',
    uiChallengeId: 'spotify-queue-drawer',
    dailyRitual: 'Trace cache priority eviction order for duplicate PUT keys in O(1) time.',
    isCompleted: false
  },
  {
    dayNumber: 6,
    dateLabel: 'Day 6 — Root Audio Singleton',
    theme: 'Unmounted State Handlers & Optimistic UI Updates',
    dsaProblemId: 'distributed-rate-limiter',
    uiChallengeId: 'spotify-queue-drawer',
    dailyRitual: 'Simulate WebSocket disconnection and verify optimistic rollback.',
    isCompleted: false
  },
  {
    dayNumber: 7,
    dateLabel: 'Day 7 — Live Mock Screen Rehearsal',
    theme: 'Full 45-Minute Screen with Voice AI Lead & Scorecard',
    dsaProblemId: 'distributed-rate-limiter',
    uiChallengeId: 'linear-command-palette',
    dailyRitual: 'Execute a full 45m timed screen, raise your hand for clarifications, and print your thermal receipt.',
    isCompleted: false
  }
];

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('dsa');
  const [user, setUser] = useState<User | null>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>(['distributed-rate-limiter']);
  const [completedFlowIds, setCompletedFlowIds] = useState<string[]>(['linear-command-palette']);
  const [streakDays, setStreakDays] = useState<number>(3);

  // Personalized Interview Profile & Daywise Roadmap
  const [profile, setProfile] = useState<UserInterviewProfile>(DEFAULT_VISITOR_PROFILE);
  const [activeTrack, setActiveTrack] = useState<InterviewTrack | null>(null);
  const [roadmap, setRoadmap] = useState<DayPlan[]>(DEFAULT_ROADMAP);
  const [customProblems, setCustomProblems] = useState<DsaProblem[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Contextual AI prompt triggered from code editor highlight
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.isAnonymous) {
        loadUserProgress(currentUser.uid).then((progress) => {
          if (progress) {
            if (progress.solvedProblems) setSolvedProblemIds(progress.solvedProblems);
            if (progress.completedUiFlows) setCompletedFlowIds(progress.completedUiFlows);
            if (progress.streakDays) setStreakDays(progress.streakDays);
          }
        });
      }
    });

    // Load saved profile / roadmap from local storage
    const savedProfile = localStorage.getItem('stackwa_interview_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Purge legacy hardcoded "Stripe in 11 days" mock data if user didn't intentionally set it
        if (parsed.targetCompany === 'Stripe' && parsed.daysRemaining === 11 && !parsed.userSet) {
          localStorage.removeItem('stackwa_interview_profile');
          setProfile(DEFAULT_VISITOR_PROFILE);
        } else {
          setProfile(parsed);
        }
      } catch {
        setProfile(DEFAULT_VISITOR_PROFILE);
      }
    } else {
      setProfile(DEFAULT_VISITOR_PROFILE);
    }

    const savedRoadmap = localStorage.getItem('stackwa_daywise_roadmap');
    if (savedRoadmap) {
      try {
        setRoadmap(JSON.parse(savedRoadmap));
      } catch {}
    }

    return () => unsubscribe();
  }, []);

  const handleSolveProblem = (problemId: string) => {
    if (!solvedProblemIds.includes(problemId)) {
      const updated = [...solvedProblemIds, problemId];
      setSolvedProblemIds(updated);
      if (user && !user.isAnonymous) {
        saveUserProgress(user.uid, { solvedProblems: updated });
      }
    }
  };

  const handleOnboardingComplete = (
    newProfile: UserInterviewProfile, 
    newRoadmap: DayPlan[], 
    customChallenge?: DsaProblem
  ) => {
    const profileToSave = { ...newProfile, userSet: true };
    setProfile(profileToSave);
    setRoadmap(newRoadmap);
    if (customChallenge) {
      setCustomProblems(prev => [customChallenge, ...prev.filter(p => p.id !== customChallenge.id)]);
    }
    localStorage.setItem('stackwa_interview_profile', JSON.stringify(profileToSave));
    localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(newRoadmap));
    setCurrentView('studio');
    setActiveTab('dsa');
    setActiveTrack(null);
  };

  const handleToggleDay = (dayNumber: number) => {
    const updated = roadmap.map(d => 
      d.dayNumber === dayNumber ? { ...d, isCompleted: !d.isCompleted } : d
    );
    setRoadmap(updated);
    localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(updated));
  };

  return (
    <div className="relative min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      
      {/* 60fps OLED Motion Particle & Waveform Canvas */}
      <SpatialCanvas interactive={true} intensity="subtle" showWaveform={true} />

      {/* Tactile Screen Tap Ripple Effect */}
      <ClickRippleEffect />

      {/* Liquid View Switcher: Landing vs Studio */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full"
          >
            <LandingPage
              onLaunchApp={() => setCurrentView('studio')}
              onSignInWithGoogle={() => loginWithGoogle()}
              user={user}
            />
          </motion.div>
        ) : (
          <motion.div
            key="studio-view"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
          
          {/* Top Clean Navbar */}
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={user} 
            streakDays={streakDays}
            profile={profile}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onNavigateHome={() => setCurrentView('landing')}
          />

          {/* Main Content Area */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'dsa' && (
                <motion.div
                  key="dsa"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {activeTrack ? (
                    <InterviewEnvironment 
                      track={activeTrack}
                      onExit={() => setActiveTrack(null)}
                      customProblems={customProblems}
                    />
                  ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                      {/* Recommendation Top Banner */}
                      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-neutral-900/90 via-rose-950/20 to-neutral-900/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {profile?.isGeneralPractice ? 'RECOMMENDED FOCUS' : `${profile?.targetCompany || 'TARGET'} ROADMAP`}
                              </span>
                              {profile?.daysRemaining ? (
                                <span className="text-xs text-neutral-400 font-mono">
                                  {profile.daysRemaining}d to Rehearsal
                                </span>
                              ) : null}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                              What will you hone today?
                            </h2>
                            <p className="text-neutral-400 text-sm max-w-2xl">
                              {profile?.isGeneralPractice 
                                ? 'Production-grade engineering tracks with interactive UI sandboxes, Architecture MCQs, and real Scrimba codecasts.'
                                : `AI curated drill focusing on ${profile?.focusAreas?.[0] || 'Core Algorithmic Invariants'} to prepare for ${profile?.targetCompany || 'your next interview'}.`}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setIsOnboardingOpen(true)}
                              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                              <span>{profile?.isGeneralPractice ? 'Calibrate Target Company' : 'Recalibrate Track'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active Tracks (3D Flippable Cards) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <Building2 className="w-4 h-4 text-rose-500" />
                            <h3 className="text-base font-bold text-white tracking-tight">Interview Tracks</h3>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">3D Flippable Cards • Select to Enter Scoped Screen</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* 1. Tailored Target Track Card if not visitor mode */}
                          {!profile?.isGeneralPractice && profile?.targetCompany && (
                            <InterviewCard 
                              track={{
                                id: 'calibrated-target',
                                company: profile.targetCompany,
                                role: profile.role || 'Full-Stack / Systems Engineer',
                                dateLabel: profile.interviewDate ? new Date(profile.interviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Round',
                                daysRemaining: profile.daysRemaining,
                                intensity: '45m',
                                difficulty: 'FAANG-Caliber',
                                focusTopics: profile.focusAreas && profile.focusAreas.length > 0 ? profile.focusAreas : ['Sliding Window', 'State Machines', 'Edge Cases'],
                                roundsCount: 3,
                                completedRounds: 0,
                                readinessScore: 82,
                                accentColor: 'rose'
                              }}
                              onEnter={(t) => setActiveTrack(t)}
                            />
                          )}

                          {/* 2. General Engineering Practice Vault Card */}
                          <InterviewCard 
                            track={{
                              id: 'general-vault',
                              company: 'General Engineering Practice',
                              role: 'Algorithms & Spatial Systems',
                              dateLabel: 'Daily Practice',
                              intensity: '30m',
                              difficulty: 'Hard',
                              focusTopics: ['Sliding Window Limiter', 'Idempotent Ledger', 'LRU O(1) Eviction'],
                              roundsCount: 3,
                              completedRounds: 1,
                              readinessScore: 78,
                              accentColor: 'rose'
                            }}
                            onEnter={(t) => setActiveTrack(t)}
                          />

                          {/* 3. New Target Calibration Action Card */}
                          <div 
                            onClick={() => setIsOnboardingOpen(true)}
                            className="h-[340px] rounded-3xl p-6 bg-neutral-950/60 border border-dashed border-white/15 hover:border-rose-500/50 flex flex-col items-center justify-center text-center cursor-pointer group transition duration-300"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition duration-300">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-white text-base">Calibrate Target Screen</h4>
                            <p className="text-xs text-neutral-400 mt-2 max-w-xs">
                              Have an upcoming interview? Talk with our Socratic AI Lead to build an adaptive track tailored to your dream company.
                            </p>
                            <span className="mt-4 px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-rose-600 group-hover:text-white text-xs font-semibold text-neutral-300 transition">
                              Launch AI Lead Chat →
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Individual Vaults Explorer (DsaArena) */}
                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Code2 className="w-4 h-4 text-rose-500" />
                            <h3 className="text-base font-bold text-white tracking-tight">Independent Problem Vaults</h3>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">Single-Problem Workspace with Holo-Deck</span>
                        </div>
                        <DsaArena 
                          onSolveProblem={handleSolveProblem} 
                          solvedProblemIds={solvedProblemIds}
                          onTriggerAiPrompt={(prompt) => setExternalAiPrompt(prompt)}
                          customProblems={customProblems}
                          onOpenCalibration={() => setIsOnboardingOpen(true)}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'roadmap' && (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <RoadmapView
                    profile={profile}
                    roadmap={roadmap}
                    onToggleDay={handleToggleDay}
                    onOpenSettings={() => setIsOnboardingOpen(true)}
                    setActiveTab={setActiveTab}
                  />
                </motion.div>
              )}

              {activeTab === 'mock-interview' && (
                <motion.div
                  key="mock-interview"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <AiMockRoom 
                    solvedCount={solvedProblemIds.length} 
                    completedFlowsCount={completedFlowIds.length} 
                  />
                </motion.div>
              )}

              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <ProgressDashboard 
                    solvedCount={solvedProblemIds.length} 
                    totalProblems={DSA_PROBLEMS.length} 
                    completedFlowsCount={completedFlowIds.length} 
                    totalFlows={UI_CHALLENGES.length} 
                    streakDays={streakDays} 
                    setActiveTab={setActiveTab} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating Dynamic Command Pill (Gemini 3.8 Flash) with Receipt Generator */}
          <FloatingAiPill
            profile={profile}
            solvedCount={solvedProblemIds.length}
            completedFlowsCount={completedFlowIds.length}
            externalPrompt={externalAiPrompt}
            onClearExternalPrompt={() => setExternalAiPrompt(null)}
          />

          {/* Conversational AI Calibration Onboarding Modal */}
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            onComplete={handleOnboardingComplete}
            initialProfile={profile}
          />

          {/* Clean Modern Studio Footer */}
          <footer className="border-t border-white/5 bg-black/80 py-6 text-center text-xs text-neutral-500 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white font-mono">Stackwa</span>
                <span>• The Spatial Technical Interview Operating System</span>
              </div>
              <div className="font-mono text-[11px] text-neutral-500">
                Encrypted Session • Cloud Persistence Active
              </div>
            </div>
          </footer>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
};

export default App;
