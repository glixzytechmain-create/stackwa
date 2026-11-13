import React, { useState, useRef, useEffect } from 'react';
import { 
  Code2, 
  Bot, 
  BarChart3, 
  Flame, 
  LogOut, 
  Calendar,
  Target,
  Home,
  ChevronDown,
  Sparkles,
  Compass,
  CheckCircle2
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isVisitorMode = profile?.isGeneralPractice || profile?.targetCompany === 'General Engineering Practice';

  return (
    <header className="sticky top-0 z-50 oled-panel border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
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

          {/* Clean Navigation Tabs (System Design standalone tab purged) */}
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

          {/* Right Section: Dynamic Status Pill, Streak & Profile Dropdown */}
          <div className="flex items-center space-x-3">
            
            {/* Dynamic Status / Target Track Pill */}
            <button
              onClick={onOpenOnboarding}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold transition"
              title="Click to recalibrate your track with AI Interviewer"
            >
              {isVisitorMode ? (
                <>
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-white">General Practice Track</span>
                </>
              ) : profile?.targetCompany ? (
                <>
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-white">{profile.targetCompany}</span>
                  {profile.daysRemaining !== undefined && (
                    <span className="text-[10px] text-rose-400 font-mono font-bold">
                      ({profile.daysRemaining}d)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-white">Calibrate Track</span>
                </>
              )}
            </button>

            {/* Streak Counter */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5 fill-rose-400" />
              <span>{streakDays}d Streak</span>
            </div>

            {/* User Profile & Settings Dropdown */}
            <div className="relative" ref={menuRef}>
              {user && !user.isAnonymous ? (
                <div>
                  <button
                    onClick={() => setIsProfileMenuOpen(prev => !prev)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-200 transition"
                  >
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
                    <span className="hidden sm:inline-block max-w-[85px] truncate font-medium">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                      {/* User Header */}
                      <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="User avatar" 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-sm font-bold text-white uppercase">
                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-white truncate">{user.displayName || 'Engineer'}</p>
                          <p className="text-[11px] text-neutral-400 font-mono truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Current Track Info */}
                      <div className="py-2.5 px-2 my-2 rounded-xl bg-neutral-900/80 border border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Current Track:</span>
                          <span className="font-bold text-rose-400 font-mono">
                            {isVisitorMode ? 'Visitor / General' : profile?.targetCompany || 'Uncalibrated'}
                          </span>
                        </div>
                        {profile?.role && !isVisitorMode && (
                          <p className="text-[10px] text-neutral-400 mt-1 truncate">{profile.role}</p>
                        )}
                        {profile?.calendarConnected && (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1.5 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Calendar Sync Active</span>
                          </div>
                        )}
                      </div>

                      {/* Switch Track / Calibrate Action */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenOnboarding();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/5 transition"
                      >
                        <span className="flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                          <span>Switch Track / Recalibrate</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">AI Lead</span>
                      </button>

                      {/* Sign Out */}
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logoutUser();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
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
      </div>
    </header>
  );
};
