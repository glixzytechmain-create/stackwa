import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SponsorBanner } from './components/SponsorBanner';
import { DsaArena } from './components/DsaArena';
import { UiDesignStudio } from './components/UiDesignStudio';
import { AiMockRoom } from './components/AiMockRoom';
import { ProgressDashboard } from './components/ProgressDashboard';
import { TabType } from './types';
import { DSA_PROBLEMS } from './data/dsaProblems';
import { UI_CHALLENGES } from './data/uiFlows';
import { 
  subscribeToAuth, 
  loadUserProgress, 
  saveUserProgress,
  loginAsGuest 
} from './firebase';
import { type User } from 'firebase/auth';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dsa');
  const [user, setUser] = useState<User | null>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>(['stock-price-maximizer']);
  const [completedFlowIds, setCompletedFlowIds] = useState<string[]>(['linear-command-palette']);
  const [streakDays, setStreakDays] = useState<number>(3);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load progress from Cloud Firestore / LocalStorage
        loadUserProgress(currentUser.uid).then((progress) => {
          if (progress) {
            if (progress.solvedProblems) setSolvedProblemIds(progress.solvedProblems);
            if (progress.completedUiFlows) setCompletedFlowIds(progress.completedUiFlows);
            if (progress.streakDays) setStreakDays(progress.streakDays);
          }
        });
      } else {
        // Automatically start with guest login for smooth zero-friction experience
        loginAsGuest();
      }
    });

    return () => unsubscribe();
  }, []);

  // Handler for solving DSA problem
  const handleSolveProblem = (problemId: string) => {
    if (!solvedProblemIds.includes(problemId)) {
      const updated = [...solvedProblemIds, problemId];
      setSolvedProblemIds(updated);
      if (user) {
        saveUserProgress(user.uid, { solvedProblems: updated });
      }
    }
  };

  // Handler for completing Mobbin UI flow
  const handleCompleteFlow = (flowId: string) => {
    if (!completedFlowIds.includes(flowId)) {
      const updated = [...completedFlowIds, flowId];
      setCompletedFlowIds(updated);
      if (user) {
        saveUserProgress(user.uid, { completedUiFlows: updated });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        streakDays={streakDays} 
      />

      {/* Sponsor Credit & Architecture Banner */}
      <SponsorBanner />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'dsa' && (
          <DsaArena 
            onSolveProblem={handleSolveProblem} 
            solvedProblemIds={solvedProblemIds} 
          />
        )}

        {activeTab === 'ui-design' && (
          <UiDesignStudio 
            onCompleteFlow={handleCompleteFlow} 
            completedFlowIds={completedFlowIds} 
          />
        )}

        {activeTab === 'mock-interview' && (
          <AiMockRoom 
            solvedCount={solvedProblemIds.length} 
            completedFlowsCount={completedFlowIds.length} 
          />
        )}

        {activeTab === 'dashboard' && (
          <ProgressDashboard 
            solvedCount={solvedProblemIds.length} 
            totalProblems={DSA_PROBLEMS.length} 
            completedFlowsCount={completedFlowIds.length} 
            totalFlows={UI_CHALLENGES.length} 
            streakDays={streakDays} 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Built for <strong className="text-slate-300">IceHacks 2026</strong> • Combining <span className="text-indigo-400">Interview Cake</span>, <span className="text-purple-400">Mobbin</span>, <span className="text-pink-400">Scrimba</span> & <span className="text-blue-400">DeployXA</span>
          </div>
          <div>
            Connected to Firebase backend: <code className="text-slate-400">stackwa</code>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
