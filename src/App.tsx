import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { SponsorBanner } from './components/SponsorBanner';
import { DsaArena } from './components/DsaArena';
import { UiDesignStudio } from './components/UiDesignStudio';
import { AiMockRoom } from './components/AiMockRoom';
import { ProgressDashboard } from './components/ProgressDashboard';
import { RoadmapView } from './components/RoadmapView';
import { OnboardingModal } from './components/OnboardingModal';
import { FloatingAiPill } from './components/FloatingAiPill';
import { TabType, UserInterviewProfile, DayPlan } from './types';
import { DSA_PROBLEMS } from './data/dsaProblems';
import { UI_CHALLENGES } from './data/uiFlows';
import { 
  subscribeToAuth, 
  loadUserProgress, 
  saveUserProgress,
  loginAsGuest 
} from './firebase';
import { type User } from 'firebase/auth';

const DEFAULT_PROFILE: UserInterviewProfile = {
  targetCompany: 'Linear',
  role: 'Frontend Engineer',
  seniority: 'Junior',
  interviewDate: '2026-11-20',
  daysRemaining: 7,
  focusAreas: ['Greedy Single-Pass', 'UI State Architecture', 'Accessibility Focus Trapping'],
  calendarConnected: true,
  onboardingCompleted: true
};

const DEFAULT_ROADMAP: DayPlan[] = [
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dsa');
  const [user, setUser] = useState<User | null>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>(['stock-price-maximizer']);
  const [completedFlowIds, setCompletedFlowIds] = useState<string[]>(['linear-command-palette']);
  const [streakDays, setStreakDays] = useState<number>(3);

  // Personalized Interview Profile & Daywise Roadmap
  const [profile, setProfile] = useState<UserInterviewProfile>(DEFAULT_PROFILE);
  const [roadmap, setRoadmap] = useState<DayPlan[]>(DEFAULT_ROADMAP);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Contextual AI prompt triggered from code editor highlight
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserProgress(currentUser.uid).then((progress) => {
          if (progress) {
            if (progress.solvedProblems) setSolvedProblemIds(progress.solvedProblems);
            if (progress.completedUiFlows) setCompletedFlowIds(progress.completedUiFlows);
            if (progress.streakDays) setStreakDays(progress.streakDays);
          }
        });
      } else {
        loginAsGuest();
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
      if (user) {
        saveUserProgress(user.uid, { solvedProblems: updated });
      }
    }
  };

  const handleCompleteFlow = (flowId: string) => {
    if (!completedFlowIds.includes(flowId)) {
      const updated = [...completedFlowIds, flowId];
      setCompletedFlowIds(updated);
      if (user) {
        saveUserProgress(user.uid, { completedUiFlows: updated });
      }
    }
  };

  const handleOnboardingComplete = (newProfile: UserInterviewProfile, newRoadmap: DayPlan[]) => {
    setProfile(newProfile);
    setRoadmap(newRoadmap);
    localStorage.setItem('stackwa_interview_profile', JSON.stringify(newProfile));
    localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(newRoadmap));
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
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        streakDays={streakDays}
        profile={profile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Sponsor Architecture Banner */}
      <SponsorBanner />

      {/* Main Content Area with Fluid Framer-Motion Transitions */}
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

      {/* Floating Dynamic Command Pill (Anakin.ai & Gemini 3.8 Flash) with Receipt Generator */}
      <FloatingAiPill
        profile={profile}
        solvedCount={solvedProblemIds.length}
        completedFlowsCount={completedFlowIds.length}
        externalPrompt={externalAiPrompt}
        onClearExternalPrompt={() => setExternalAiPrompt(null)}
      />

      {/* Calibration Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
        initialProfile={profile}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Built for <strong className="text-white">IceHacks 2026</strong> • Multi-Sponsor Architecture (<span className="text-sky-400">Interview Cake</span> • <span className="text-purple-400">Mobbin</span> • <span className="text-pink-400">Scrimba</span> • <span className="text-blue-400">DeployXA</span> • <span className="text-emerald-400">Anakin.ai</span>)
          </div>
          <div className="font-mono text-[11px] text-neutral-500">
            Backend: <code className="text-rose-400">stackwa (Firebase)</code>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
