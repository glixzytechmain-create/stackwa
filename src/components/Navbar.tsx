import React, { useState, useRef, useEffect } from 'react';
import { 
  Code2, 
  LogOut, 
  Home,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Sliders,
  Keyboard
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
  streakDays: _streakDays,
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
              <img 
                src="/stackwa-logo.png" 
                alt="Stackwa" 
                className="h-8 w-auto object-contain group-hover:opacity-90 transition" 
              />
              <span className="hidden sm:inline-block text-[10px] text-neutral-400 font-mono tracking-widest uppercase border border-white/10 px-1.5 py-0.5 rounded-md bg-white/5">
                OS
              </span>
            </div>

            <button
              onClick={onNavigateHome}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>

          {/* General App Pages in Global Header */}
          <nav className="hidden md:flex items-center space-x-1 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('dsa')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dsa' || activeTab === 'vaults'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>DSA Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('sponsors')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'sponsors'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Sponsors & Tools</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'shortcuts'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
          </nav>

          {/* Right Section: Dynamic Status Pill, Streak & Profile Dropdown */}
          <div className="flex items-center space-x-3">
            
            {/* Neutral Goal Calibration Launcher - Decoupled from individual goal cards */}
            <button
              onClick={onOpenOnboarding}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition"
              title="Calibrate a new target interview goal with AI Interviewer"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Calibrate Goal</span>
            </button>


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

                      {/* Multi-Goal Workspace Info */}
                      <div className="py-2.5 px-2 my-2 rounded-xl bg-neutral-900/80 border border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">Strategy:</span>
                          <span className="font-bold text-rose-400 font-mono">
                            Multi-Goal Architecture
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Independent goal cards for each target screen.</p>
                        {profile?.calendarConnected && (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1.5 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Calendar Sync Active</span>
                          </div>
                        )}
                      </div>

                      {/* Add New Goal Action */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenOnboarding();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/5 transition"
                      >
                        <span className="flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                          <span>+ Calibrate New Goal</span>
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
