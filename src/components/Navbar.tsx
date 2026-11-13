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
  Sparkles
} from 'lucide-react';
import { TabType } from '../types';
import { loginAsGuest, loginWithGoogle, logoutUser } from '../firebase';
import { type User } from 'firebase/auth';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  streakDays 
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dsa')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Stackwa</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  IceHacks 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400">DSA & UI System Design Studio</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dsa')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'dsa'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>DSA Arena</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Interview Cake
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ui-design')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'ui-design'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>UI System Design</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                Mobbin
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mock-interview')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'mock-interview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Mock Room</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Coach
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Readiness</span>
            </button>
          </nav>

          {/* Right Section: Streak & Firebase Auth */}
          <div className="flex items-center space-x-3">
            {/* Streak Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{streakDays} Day Streak</span>
            </div>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user.isAnonymous ? 'G' : (user.displayName?.[0] || user.email?.[0] || 'U')}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {user.isAnonymous ? 'Guest User' : (user.displayName || user.email?.split('@')[0])}
                  </span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  title="Sign out"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loginAsGuest()}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                >
                  Guest Login
                </button>
                <button
                  onClick={() => loginWithGoogle()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition flex items-center space-x-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* DeployXA Live Badge */}
            <a 
              href="https://deployxa.com" 
              target="_blank" 
              rel="noreferrer"
              className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 transition"
            >
              <span>DeployXA</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
