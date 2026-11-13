import React from 'react';
import { 
  Code2, 
  Layers, 
  Bot, 
  BarChart3, 
  Flame, 
  User as UserIcon, 
  LogOut, 
  ExternalLink,
  Sparkles,
  Calendar,
  Target
} from 'lucide-react';
import { TabType, UserInterviewProfile } from '../types';
import { loginAsGuest, loginWithGoogle, logoutUser } from '../firebase';
import { type User } from 'firebase/auth';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
  streakDays: number;
  profile: UserInterviewProfile | null;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  streakDays,
  profile,
  onOpenOnboarding
}) => {
  return (
    <header className="sticky top-0 z-50 oled-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand (Deep Red Accent & Crisp White) */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dsa')}>
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Stackwa</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  IceHacks
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">Focus & Flow Studio</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-neutral-900/60 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('dsa')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dsa'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>DSA Vaults</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 font-mono">
                Cake
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ui-design')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ui-design'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mobbin X-Ray</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono">
                Mobbin
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'roadmap'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daywise Roadmap</span>
              {profile && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-mono">
                  {profile.targetCompany}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mock-interview')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'mock-interview'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Coach</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Flash
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Readiness</span>
            </button>
          </nav>

          {/* Right Section: Company Target, Streak & User Auth */}
          <div className="flex items-center space-x-3">
            
            {/* Target Goal Pill (Clickable to open Onboarding Setup) */}
            <button
              onClick={onOpenOnboarding}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold transition"
              title="Change target company or interview date"
            >
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>{profile?.targetCompany || 'Set Target Goal'}</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {profile?.daysRemaining ? `(${profile.daysRemaining}d)` : ''}
              </span>
            </button>

            {/* Streak Counter */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5 fill-rose-400" />
              <span>{streakDays}d Streak</span>
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user.isAnonymous ? 'G' : (user.displayName?.[0] || user.email?.[0] || 'U')}
                  </div>
                  <span className="max-w-[85px] truncate font-medium">
                    {user.isAnonymous ? 'Guest' : (user.displayName || user.email?.split('@')[0])}
                  </span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  title="Sign out"
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-500 transition border border-white/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loginAsGuest()}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 rounded-xl border border-white/10 transition"
                >
                  Guest
                </button>
                <button
                  onClick={() => loginWithGoogle()}
                  className="px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <UserIcon className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* DeployXA Live link */}
            <a 
              href="https://deployxa.com" 
              target="_blank" 
              rel="noreferrer"
              className="hidden xl:flex items-center space-x-1 text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/5 transition"
            >
              <span>DeployXA</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>

          </div>

        </div>
      </div>
    </header>
  );
};
