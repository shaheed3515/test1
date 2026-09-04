import { User, LogOut, Trash2, X, Shield, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfileModal({ isOpen, onClose, user, onSignOut, onClearAllHistory, theme = 'light' }) {
  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignOut();
    onClose();
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`relative w-full max-w-md rounded-2xl p-6 md:p-7 shadow-2xl border transition-all ${
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

        {/* User Card */}
        <div className={`flex items-center gap-4 mb-6 pb-5 border-b ${
          isDark ? 'border-[#333]' : 'border-gray-100'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-600/20">
            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold truncate">
              {user.email?.split('@')[0] || 'Student Profile'}
            </h2>
            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pro Student Account Active
            </div>
          </div>
        </div>

        {/* Account Info Details */}
        <div className="space-y-2.5 mb-6 text-xs">
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#171717] border-[#333]' : 'bg-gray-50 border-gray-200/70'
          }`}>
            <span className={`flex items-center gap-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Student Identifier
            </span>
            <span className="font-mono text-[11px] truncate max-w-[170px] text-gray-500">
              {user.id || 'local-guest'}
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#171717] border-[#333]' : 'bg-gray-50 border-gray-200/70'
          }`}>
            <span className={`flex items-center gap-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Member Since
            </span>
            <span className="text-[11px] text-gray-500">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat sessions on this device?')) {
                onClearAllHistory();
                onClose();
              }
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#171717] hover:bg-rose-950/30 text-rose-400 border-[#333] hover:border-rose-900' 
                : 'bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 border-gray-200 hover:border-rose-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Study History</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-600/15 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
