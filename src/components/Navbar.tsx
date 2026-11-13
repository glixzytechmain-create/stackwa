import React from 'react';
import { 
  Code2, 
  Layers, 
  Bot, 
  BarChart3, 
  Flame, 
  LogOut, 
  Calendar,
  Target,
  Home
} from 'lucide-react';
import { TabType, UserInterviewProfile } from '../types';
import { loginWithGoogle, logoutUser } from '../firebase';
import { type User } from 'firebase/auth';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
  streakDays: number;
  profile: UserInterviewProfile | null;
  onOpenOnboarding: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  streakDays,
  profile,
  onOpenOnboarding,
  onNavigateHome
}) => {
  return (
    <header className="sticky top-0 z-50 oled-panel border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand (Clean & Pure) */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer group" 
              onClick={onNavigateHome}
              title="Return to Home Landing Page"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-rose-600/30 group-hover:scale-105 transition">
                S
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white font-mono">Stackwa</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] text-neutral-400 font-mono tracking-widest uppercase">OS</span>
              </div>
            </div>

            <button
              onClick={onNavigateHome}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>

          {/* Clean Navigation Tabs (No Sponsor Badges) */}
          <nav className="hidden md:flex items-center space-x-1 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('dsa')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dsa'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>DSA Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('ui-design')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ui-design'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>System Design</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'roadmap'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('mock-interview')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'mock-interview'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Coach</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Readiness</span>
            </button>
          </nav>

          {/* Right Section: Target Goal, Streak & Google Auth */}
          <div className="flex items-center space-x-3">
            
            {/* Target Goal Pill (Clickable to trigger Conversational Recalibration) */}
            <button
              onClick={onOpenOnboarding}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold transition"
              title="Click to recalibrate with AI Interviewer"
            >
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>{profile?.targetCompany || 'Calibrate Interview'}</span>
              {profile?.daysRemaining ? (
                <span className="text-[10px] text-neutral-400 font-mono">
                  ({profile.daysRemaining}d)
                </span>
              ) : null}
            </button>

            {/* Streak Counter */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5 fill-rose-400" />
              <span>{streakDays}d Streak</span>
            </div>

            {/* Google Authentication */}
            {user && !user.isAnonymous ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-200">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User avatar" 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <span className="max-w-[90px] truncate font-medium">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  title="Sign out of Google"
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-400 transition border border-white/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl shadow-sm transition flex items-center space-x-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google Sign-In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
