import { User, LogOut, Trash2, X, Shield, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfileModal({ isOpen, onClose, user, onSignOut, onClearAllHistory }) {
  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-semibold text-white truncate">
              {user.email?.split('@')[0] || 'User Profile'}
            </h2>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Account
            </div>
          </div>
        </div>

        {/* Account Info Details */}
        <div className="space-y-3 mb-6 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              User ID
            </span>
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">
              {user.id || 'local-guest'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Member Since
            </span>
            <span className="text-slate-300 text-[11px]">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat sessions on this device?')) {
                onClearAllHistory();
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/60 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Chat History</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
