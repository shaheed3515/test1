import { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2, Sparkles, CheckCircle2, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, theme = 'light' }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!supabase) {
      setErrorMsg('Supabase client is not configured. Check VITE_SUPABASE_URL.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        if (data.session) {
          setSuccessMsg('Account created successfully!');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 800);
        } else {
          setSuccessMsg('Sign up successful! Please check your email to confirm.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Welcome back!');
        onAuthSuccess(data.user);
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`relative w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border transition-all ${
          isDark 
            ? 'bg-[#212121] border-[#333] text-gray-100' 
            : isSepia
              ? 'bg-[#fbf7ee] border-[#dfd4c3] text-[#2c2722]'
              : 'bg-white border-gray-100 text-gray-900 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark 
              ? 'text-gray-400 hover:text-white hover:bg-[#333]' 
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {isSignUp ? 'Create your Student Account' : 'Welcome to StudyGPT'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isSignUp ? 'Sync lecture notes and study history across devices' : 'Sign in to access your study library'}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#171717] border-[#383838] text-white placeholder-gray-500 focus:border-emerald-500'
                    : 'bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#171717] border-[#383838] text-white placeholder-gray-500 focus:border-emerald-500'
                    : 'bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSignUp ? 'Create Student Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer switch */}
        <div className={`mt-6 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-emerald-600 font-semibold hover:underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New student?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-emerald-600 font-semibold hover:underline ml-1 cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
