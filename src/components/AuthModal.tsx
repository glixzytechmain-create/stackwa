import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Zap
} from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest } from '../firebase';
import type { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please fill in both email and password.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      let user: User;
      if (mode === 'signup') {
        user = await registerWithEmail(email.trim(), password, name.trim() || undefined);
      } else {
        user = await loginWithEmail(email.trim(), password);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error("Auth action error:", err);
      let msg = err.message || 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to Sign In.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onSuccess(user);
        onClose();
      } else {
        setError('Google sign-in was not completed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in encountered an issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginAsGuest();
      if (user) {
        onSuccess(user);
        onClose();
      } else {
        setError('Guest sandbox session creation failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-left overflow-hidden z-10"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
            {mode === 'signup' 
              ? 'Save your target company roadmaps, telemetry, and live DSA & UI benchmarks across all devices.'
              : 'Sign in to access your calibrated company roadmaps and readiness metrics.'}
          </p>

          {/* Switch tabs (Sign In vs Sign Up) */}
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Google Sign-In Quick Action */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs transition flex items-center justify-center space-x-2.5 shadow-md disabled:opacity-60 mb-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-neutral-950 px-3 text-[11px] text-neutral-500 font-mono uppercase tracking-wider">
              Or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full bg-white/5 border border-white/10 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition"
                />
              </div>
              <p className="mt-1 text-[10px] text-neutral-500">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating...' : (mode === 'signup' ? 'Create Account & Enter' : 'Sign In to Stackwa')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Sandbox / Guest Bypass */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <span className="text-[11px] text-neutral-500">Need immediate testing?</span>
            <button
              type="button"
              onClick={handleGuestAuth}
              className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Instant Guest Mode</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
