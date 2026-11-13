import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SpatialCanvas } from './components/SpatialCanvas';
import { DsaArena } from './components/DsaArena';
import { UiDesignStudio } from './components/UiDesignStudio';
import { AiMockRoom } from './components/AiMockRoom';
import { ProgressDashboard } from './components/ProgressDashboard';
import { RoadmapView } from './components/RoadmapView';
import { OnboardingModal } from './components/OnboardingModal';
import { FloatingAiPill } from './components/FloatingAiPill';
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

const DEFAULT_PROFILE: UserInterviewProfile = {
  targetCompany: 'Stripe',
  role: 'Frontend / Systems Engineer',
  seniority: 'Mid-Level',
  interviewDate: '2026-11-25',
  daysRemaining: 11,
  focusAreas: ['Sliding Window & Rate Limiting', 'Transactional State Machines', 'Defensive Edge Cases'],
  calendarConnected: true,
  onboardingCompleted: true
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
  const [profile, setProfile] = useState<UserInterviewProfile>(DEFAULT_PROFILE);
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
        setProfile(JSON.parse(savedProfile));
      } catch {}
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

  const handleCompleteFlow = (flowId: string) => {
    if (!completedFlowIds.includes(flowId)) {
      const updated = [...completedFlowIds, flowId];
      setCompletedFlowIds(updated);
      if (user && !user.isAnonymous) {
        saveUserProgress(user.uid, { completedUiFlows: updated });
      }
    }
  };

  const handleOnboardingComplete = (
    newProfile: UserInterviewProfile, 
    newRoadmap: DayPlan[], 
    customChallenge?: DsaProblem
  ) => {
    setProfile(newProfile);
    setRoadmap(newRoadmap);
    if (customChallenge) {
      setCustomProblems(prev => [customChallenge, ...prev.filter(p => p.id !== customChallenge.id)]);
    }
    localStorage.setItem('stackwa_interview_profile', JSON.stringify(newProfile));
    localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(newRoadmap));
    setCurrentView('studio');
    setActiveTab('roadmap');
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

      {/* View 1: Cinematic Motion Landing Page */}
      {currentView === 'landing' ? (
        <LandingPage
          onLaunchApp={() => setCurrentView('studio')}
          onSignInWithGoogle={() => loginWithGoogle()}
          user={user}
        />
      ) : (
        /* View 2: Studio Workspace */
        <div className="relative z-10 flex flex-col min-h-screen">
          
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DsaArena 
                    onSolveProblem={handleSolveProblem} 
                    solvedProblemIds={solvedProblemIds}
                    onTriggerAiPrompt={(prompt) => setExternalAiPrompt(prompt)}
                    customProblems={customProblems}
                    onOpenCalibration={() => setIsOnboardingOpen(true)}
                  />
                </motion.div>
              )}

              {activeTab === 'ui-design' && (
                <motion.div
                  key="ui-design"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <UiDesignStudio 
                    onCompleteFlow={handleCompleteFlow} 
                    completedFlowIds={completedFlowIds} 
                  />
                </motion.div>
              )}

              {activeTab === 'roadmap' && (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
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
        </div>
      )}

    </div>
  );
};

export default App;
