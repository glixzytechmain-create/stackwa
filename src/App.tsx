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
import { InterviewCard, InterviewTrack, GoalSectionTab } from './components/InterviewCard';
import { InterviewEnvironment } from './components/InterviewEnvironment';
import { SettingsView } from './components/SettingsView';
import { CheatsheetView } from './components/CheatsheetView';
import { ShortcutsView } from './components/ShortcutsView';
import { Building2, Sparkles, Code2 } from 'lucide-react';
import { TabType, UserInterviewProfile, DayPlan, DsaProblem, TestSessionRecord, SavedVisualExplanation } from './types';
import { generateHighEffortRoadmap } from './services/roadmapService';
import { DSA_PROBLEMS } from './data/dsaProblems';
import { UI_CHALLENGES } from './data/uiFlows';
import { 
  subscribeToAuth, 
  loadUserProgress, 
  saveUserProgress,
  loginWithGoogle,
  logoutUser
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

const DEFAULT_GOALS: InterviewTrack[] = [
  {
    id: 'goal-general',
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
  }
];

// Helper to read initial view from URL hash/query or localStorage
const getInitialRouteState = () => {
  if (typeof window === 'undefined') {
    return {
      view: 'landing' as 'landing' | 'studio',
      tab: 'dsa' as TabType,
      trackId: null as string | null,
      goalTab: 'rehearsal' as GoalSectionTab
    };
  }

  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const paramStr = hash.includes('?') ? hash.split('?')[1] : search.replace(/^\?/, '');
    const params = new URLSearchParams(paramStr);

    const storedView = localStorage.getItem('stackwa_current_view');
    const storedTab = localStorage.getItem('stackwa_active_tab') as TabType;
    const storedTrackId = localStorage.getItem('stackwa_active_track_id');
    const storedGoalTab = localStorage.getItem('stackwa_goal_tab') as GoalSectionTab;

    // Check if hash or query indicates studio
    const isStudio = hash.startsWith('#studio') || params.get('view') === 'studio' || storedView === 'studio';
    const isHome = hash === '#home' || params.get('view') === 'home' || storedView === 'landing';

    const view: 'landing' | 'studio' = (isHome && !hash.startsWith('#studio')) ? 'landing' : (isStudio ? 'studio' : 'landing');
    const tab: TabType = (params.get('tab') as TabType) || (storedTab && storedTab !== 'mock-interview' ? storedTab : 'dsa');
    const trackId: string | null = params.get('track') || storedTrackId || null;
    const rawGoalTab = params.get('wtab') || storedGoalTab || 'rehearsal';
    const goalTab: GoalSectionTab = rawGoalTab === 'coach' ? 'readiness' : (rawGoalTab as GoalSectionTab);

    return { view, tab, trackId, goalTab };
  } catch {
    return {
      view: 'landing' as 'landing' | 'studio',
      tab: 'dsa' as TabType,
      trackId: null as string | null,
      goalTab: 'rehearsal' as GoalSectionTab
    };
  }
};

export const App: React.FC = () => {
  const initialRoute = getInitialRouteState();
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>(initialRoute.view);
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [user, setUser] = useState<User | null>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>(['distributed-rate-limiter']);
  const [completedFlowIds, setCompletedFlowIds] = useState<string[]>(['linear-command-palette']);
  const [streakDays, setStreakDays] = useState<number>(3);

  // Personalized Interview Profile, Goals, & Daywise Roadmap
  const [profile, setProfile] = useState<UserInterviewProfile>(() => {
    try {
      const saved = localStorage.getItem('stackwa_interview_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_VISITOR_PROFILE;
  });

  const [goals, setGoals] = useState<InterviewTrack[]>(() => {
    try {
      const saved = localStorage.getItem('stackwa_interview_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GOALS;
  });

  const [activeTrack, setActiveTrack] = useState<InterviewTrack | null>(() => {
    if (!initialRoute.trackId) return null;
    try {
      const savedGoals: InterviewTrack[] = JSON.parse(localStorage.getItem('stackwa_interview_goals') || '[]');
      const all = [...savedGoals, ...DEFAULT_GOALS];
      return all.find(g => g.id === initialRoute.trackId || g.company.toLowerCase() === initialRoute.trackId?.toLowerCase()) || null;
    } catch {}
    return null;
  });

  const [activeGoalTab, setActiveGoalTab] = useState<GoalSectionTab>(initialRoute.goalTab);
  const [roadmap, setRoadmap] = useState<DayPlan[]>(() => {
    try {
      const saved = localStorage.getItem('stackwa_daywise_roadmap');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ROADMAP;
  });
  const [customProblems, setCustomProblems] = useState<DsaProblem[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Synchronize route and view state to localStorage & URL hash so refresh restores exact page
  useEffect(() => {
    try {
      localStorage.setItem('stackwa_current_view', currentView);
      localStorage.setItem('stackwa_active_tab', activeTab);
      if (activeTrack) {
        localStorage.setItem('stackwa_active_track_id', activeTrack.id);
      } else {
        localStorage.removeItem('stackwa_active_track_id');
      }
      localStorage.setItem('stackwa_goal_tab', activeGoalTab);

      // Synchronize with URL hash
      if (currentView === 'studio') {
        const params = new URLSearchParams();
        params.set('tab', activeTab);
        if (activeTrack) {
          params.set('track', activeTrack.id);
          params.set('wtab', activeGoalTab);
        }
        window.history.replaceState(null, '', `#studio?${params.toString()}`);
      } else {
        window.history.replaceState(null, '', '#home');
      }
    } catch {}
  }, [currentView, activeTab, activeTrack, activeGoalTab]);

  // Contextual AI prompt triggered from code editor highlight
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | null>(null);

  // DOM Isolation Guard: Evict any stray elements injected directly into document.body outside #root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cleanupRogueNodes = () => {
      const children = Array.from(document.body.children);
      children.forEach(child => {
        if (child.id !== 'root' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.tagName !== 'LINK') {
          try {
            child.remove();
          } catch {}
        }
      });
    };
    cleanupRogueNodes();
    const observer = new MutationObserver(cleanupRogueNodes);
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);

  // Enrich any saved legacy repetitive roadmap with tailored high-effort rituals
  useEffect(() => {
    if (roadmap && roadmap.length > 0) {
      const isLegacyRepetitive = roadmap.every(d => d.dailyRitual === roadmap[0].dailyRitual);
      if (isLegacyRepetitive) {
        const enriched = generateHighEffortRoadmap(
          profile?.targetCompany || 'Tech Company',
          profile?.role || 'Software Engineer',
          roadmap.length,
          profile?.focusAreas
        );
        setRoadmap(enriched);
        localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(enriched));
      }
    }
  }, [profile?.targetCompany, profile?.role]);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.isAnonymous) {
        // Authenticated user: if on landing, transition straight into Studio and open onboarding greeting
        setCurrentView((prev) => {
          if (prev === 'landing') {
            localStorage.setItem('stackwa_current_view', 'studio');
            setIsOnboardingOpen(true);
            return 'studio';
          }
          return prev;
        });

        loadUserProgress(currentUser.uid).then((progress) => {
          if (progress) {
            if (progress.solvedProblems) setSolvedProblemIds(progress.solvedProblems);
            if (progress.completedUiFlows) setCompletedFlowIds(progress.completedUiFlows);
            if (progress.streakDays) setStreakDays(progress.streakDays);
            if (progress.goals && Array.isArray(progress.goals) && progress.goals.length > 0) {
              setGoals(progress.goals);
              localStorage.setItem('stackwa_interview_goals', JSON.stringify(progress.goals));
            }
            if (progress.profile && progress.profile.targetCompany) {
              setProfile(progress.profile);
              localStorage.setItem('stackwa_interview_profile', JSON.stringify(progress.profile));
            }
            if (progress.roadmap && Array.isArray(progress.roadmap) && progress.roadmap.length > 0) {
              setRoadmap(progress.roadmap);
              localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(progress.roadmap));
            }
          } else {
            // First time login on this account: sync any existing local goals to Firestore
            const localGoals = localStorage.getItem('stackwa_interview_goals');
            const localProfile = localStorage.getItem('stackwa_interview_profile');
            const localRoadmap = localStorage.getItem('stackwa_daywise_roadmap');
            if (localGoals || localProfile || localRoadmap) {
              try {
                saveUserProgress(currentUser.uid, {
                  goals: localGoals ? JSON.parse(localGoals) : undefined,
                  profile: localProfile ? JSON.parse(localProfile) : undefined,
                  roadmap: localRoadmap ? JSON.parse(localRoadmap) : undefined
                });
              } catch {}
            }
          }
        });
      } else if (!currentUser) {
        // User logged out: completely reset view state to Landing Page and clear active track
        setCurrentView('landing');
        setActiveTrack(null);
        localStorage.setItem('stackwa_current_view', 'landing');
        window.location.hash = '#home';
      }
    });

    // Load saved goals from local storage as initial offline state
    const savedGoals = localStorage.getItem('stackwa_interview_goals');
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
        }
      } catch {}
    }

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
          // If profile has a user-set company and goals don't have it yet, add it
          if (!parsed.isGeneralPractice && parsed.targetCompany && parsed.userSet) {
            setGoals(prev => {
              if (prev.some(g => g.company.toLowerCase() === parsed.targetCompany.toLowerCase())) return prev;
              return [
                {
                  id: `goal-${parsed.targetCompany.toLowerCase()}`,
                  company: parsed.targetCompany,
                  role: parsed.role || 'Software Engineer',
                  dateLabel: parsed.interviewDate ? new Date(parsed.interviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Round',
                  daysRemaining: parsed.daysRemaining,
                  intensity: '45m',
                  difficulty: 'FAANG-Caliber',
                  focusTopics: parsed.focusAreas && parsed.focusAreas.length > 0 ? parsed.focusAreas : ['Sliding Window', 'State Machines', 'Edge Cases'],
                  roundsCount: 3,
                  completedRounds: 0,
                  readinessScore: 82,
                  accentColor: 'rose'
                },
                ...prev
              ];
            });
          }
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

    // Add as independent dedicated goal track
    if (!newProfile.isGeneralPractice && newProfile.targetCompany) {
      const newTrack: InterviewTrack = {
        id: `goal-${Date.now()}`,
        company: newProfile.targetCompany,
        role: newProfile.role || 'Software Engineer',
        dateLabel: newProfile.interviewDate ? new Date(newProfile.interviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Round',
        daysRemaining: newProfile.daysRemaining,
        intensity: '45m',
        difficulty: 'FAANG-Caliber',
        focusTopics: newProfile.focusAreas && newProfile.focusAreas.length > 0 ? newProfile.focusAreas : ['Sliding Window', 'State Machines', 'Edge Cases'],
        roundsCount: 3,
        completedRounds: 0,
        readinessScore: 82,
        accentColor: 'rose'
      };

      setGoals(prev => {
        const withoutSame = prev.filter(g => g.company.toLowerCase() !== newTrack.company.toLowerCase());
        const updated = [newTrack, ...withoutSame];
        localStorage.setItem('stackwa_interview_goals', JSON.stringify(updated));
        if (user) {
          saveUserProgress(user.uid, {
            goals: updated,
            profile: profileToSave,
            roadmap: newRoadmap
          });
        }
        return updated;
      });
    }

    localStorage.setItem('stackwa_interview_profile', JSON.stringify(profileToSave));
    localStorage.setItem('stackwa_daywise_roadmap', JSON.stringify(newRoadmap));
    if (user) {
      saveUserProgress(user.uid, {
        profile: profileToSave,
        roadmap: newRoadmap
      });
    }
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
    if (user) {
      saveUserProgress(user.uid, { roadmap: updated });
    }
  };

  const handleSaveTestRecord = (record: TestSessionRecord) => {
    const updatedHistory = [...(profile.testHistory || []), record];
    const updatedProfile: UserInterviewProfile = {
      ...profile,
      testHistory: updatedHistory
    };
    setProfile(updatedProfile);
    localStorage.setItem('stackwa_interview_profile', JSON.stringify(updatedProfile));

    if (user) {
      saveUserProgress(user.uid, {
        profile: updatedProfile
      });
    }
  };

  const handleSaveExplanation = (explanation: SavedVisualExplanation) => {
    const existing = profile.savedExplanations || [];
    const filtered = existing.filter(e => e.problemId !== explanation.problemId);
    const updatedExplanations = [explanation, ...filtered];
    const updatedProfile: UserInterviewProfile = {
      ...profile,
      savedExplanations: updatedExplanations
    };
    setProfile(updatedProfile);
    localStorage.setItem('stackwa_interview_profile', JSON.stringify(updatedProfile));

    if (user) {
      saveUserProgress(user.uid, {
        profile: updatedProfile
      });
    }
  };

  const handleLaunchStudio = () => {
    setCurrentView('studio');
    try {
      localStorage.setItem('stackwa_current_view', 'studio');
    } catch {}
  };

  const handleNavigateHome = () => {
    setCurrentView('landing');
    try {
      localStorage.setItem('stackwa_current_view', 'landing');
      window.location.hash = '#home';
      window.history.replaceState(null, '', '#home');
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {}
    setUser(null);
    setActiveTrack(null);
    setCurrentView('landing');
    localStorage.setItem('stackwa_current_view', 'landing');
    try {
      window.location.hash = '#home';
      window.history.replaceState(null, '', '#home');
    } catch {}
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
              onLaunchApp={handleLaunchStudio}
              onSignInWithGoogle={async () => {
                const loggedUser = await loginWithGoogle();
                if (loggedUser && !loggedUser.isAnonymous) {
                  setCurrentView('studio');
                  localStorage.setItem('stackwa_current_view', 'studio');
                  setIsOnboardingOpen(true);
                }
              }}
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
            onNavigateHome={handleNavigateHome}
            onSignOut={handleSignOut}
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
                      initialTab={activeGoalTab}
                      profile={profile}
                      roadmap={roadmap}
                      onToggleDay={handleToggleDay}
                      onOpenSettings={() => setIsOnboardingOpen(true)}
                      onSaveTestRecord={handleSaveTestRecord}
                      onSaveExplanation={handleSaveExplanation}
                      solvedCount={solvedProblemIds.length}
                      completedFlowsCount={completedFlowIds.length}
                      streakDays={streakDays}
                    />
                  ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                      {/* Dynamic Multi-Goal Workspace Top Banner */}
                      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-neutral-900/90 via-rose-950/20 to-neutral-900/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                MULTI-GOAL ARCHITECTURE
                              </span>
                              <span className="text-xs text-neutral-400 font-mono">
                                {goals.length} Active {goals.length === 1 ? 'Goal' : 'Goals'} Configured
                              </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                              What will you hone today?
                            </h2>
                            <p className="text-neutral-400 text-sm max-w-2xl leading-relaxed">
                              Each goal card represents an isolated, company-scoped interview screen. Enter any card to rehearse its dedicated DSA invariants, System Architecture flows, and Socratic defense.
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setIsOnboardingOpen(true)}
                              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                              <span>+ Calibrate New Goal</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active Tracks (3D Flippable Cards) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <Building2 className="w-4 h-4 text-rose-500" />
                            <h3 className="text-base font-bold text-white tracking-tight">Interview Goals & Tracks</h3>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">3D Flippable Cards • Select to Enter Dedicated Screen</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Render all independent goal cards */}
                          {goals.map((track) => (
                            <InterviewCard 
                              key={track.id}
                              track={track}
                              onEnter={(t, tab) => {
                                setActiveTrack(t);
                                setActiveGoalTab(tab || 'rehearsal');
                              }}
                            />
                          ))}

                          {/* New Target Calibration Action Card */}
                          <div 
                            onClick={() => setIsOnboardingOpen(true)}
                            className="h-[340px] rounded-3xl p-6 bg-neutral-950/60 border border-dashed border-white/15 hover:border-rose-500/50 flex flex-col items-center justify-center text-center cursor-pointer group transition duration-300"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition duration-300">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-white text-base">Calibrate Another Screen</h4>
                            <p className="text-xs text-neutral-400 mt-2 max-w-xs">
                              Have another interview coming up? Chat with our Socratic AI Lead to build a dedicated track with custom roadmap & syllabus.
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

              {/* General App Pages: Cheatsheet & Invariants, Settings, Shortcuts */}
              {(activeTab === 'cheatsheet' || activeTab === 'sponsors') && (
                <motion.div
                  key="cheatsheet"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <CheatsheetView />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <SettingsView 
                    user={user} 
                    profile={profile}
                    onClearData={() => {
                      setGoals(DEFAULT_GOALS);
                      setSolvedProblemIds([]);
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'shortcuts' && (
                <motion.div
                  key="shortcuts"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <ShortcutsView />
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
                    profile={profile}
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
              <div className="flex items-center space-x-2.5">
                <img src="/stackwa-logo.png" alt="Stackwa" className="h-5 w-auto object-contain opacity-85" />
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
