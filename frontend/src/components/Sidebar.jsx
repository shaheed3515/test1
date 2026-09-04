import { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Search, 
  Settings, 
  PanelLeftClose, 
  Sun, 
  Moon, 
  Coffee, 
  GraduationCap, 
  LogIn 
} from 'lucide-react';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  user,
  onOpenAuth,
  onOpenProfile,
  isOpen,
  onToggle,
  theme,
  setTheme
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    (s.title || 'Untitled Session').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 h-full flex flex-col transition-all duration-300 ease-in-out border-r shrink-0 select-none ${
          theme === 'dark' 
            ? 'bg-[#171717] border-[#2f2f2f] text-gray-200' 
            : theme === 'sepia'
              ? 'bg-[#f5efe6] border-[#e2d8c7] text-[#3d3832]'
              : 'bg-[#f9f9f9] border-[#e5e7eb] text-gray-800'
        } ${
          isOpen 
            ? 'w-[270px] translate-x-0 opacity-100 pointer-events-auto' 
            : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-r-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-[270px] h-full flex flex-col shrink-0">
          {/* Top Header */}
          <div className="p-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                theme === 'dark'
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-600 text-white shadow-emerald-600/20'
              }`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-none">StudyGPT</h1>
                <span className={`text-[10px] font-medium leading-none ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Notebook Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Close / Collapse button */}
              <button
                type="button"
                onClick={onToggle}
                title="Collapse sidebar"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-[#262626]' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/70'
                }`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onNewSession();
                if (window.innerWidth < 768) onToggle();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#212121] hover:bg-[#2a2a2a] text-gray-100 border border-[#333]'
                  : theme === 'sepia'
                    ? 'bg-[#eae0d0] hover:bg-[#e0d4c2] text-[#2c2722] border border-[#d8ccb8]'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>New study session</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                theme === 'dark' ? 'bg-[#333] text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>⌘K</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats & notes..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg transition-colors focus:outline-none ${
                  theme === 'dark'
                    ? 'bg-[#212121] border border-[#333] text-gray-100 placeholder-gray-500 focus:border-emerald-500'
                    : theme === 'sepia'
                      ? 'bg-[#eae0d0]/60 border border-[#d8ccb8] text-[#2c2722] placeholder-gray-500 focus:border-amber-700'
                      : 'bg-white/80 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-600 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Sessions History List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            <div className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 flex items-center justify-between ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <span>Your Study Chats</span>
              <span>{filteredSessions.length}</span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className={`p-6 text-center text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No sessions found. Start a new one!
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onToggle();
                    }}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-[#212121] text-white font-medium shadow-xs'
                          : theme === 'sepia'
                            ? 'bg-[#e4dac8] text-[#1c1917] font-semibold shadow-xs'
                            : 'bg-[#ececec] text-gray-900 font-semibold shadow-xs'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-[#212121]/60'
                          : theme === 'sepia'
                            ? 'text-[#5f584f] hover:text-[#1c1917] hover:bg-[#eae0d0]/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-emerald-600' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <span className="truncate flex-1 text-left">
                      {session.title || 'New Study Session'}
                    </span>

                    {/* Delete Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      title="Delete session"
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-rose-400 hover:bg-[#333]'
                          : 'text-gray-400 hover:text-rose-600 hover:bg-gray-300/60'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Theme Mode & Footer Actions */}
          <div className={`p-2.5 border-t space-y-1.5 ${
            theme === 'dark' 
              ? 'border-[#282828] bg-[#141414]' 
              : theme === 'sepia'
                ? 'border-[#e0d6c5] bg-[#ede5d8]'
                : 'border-gray-200 bg-[#f4f4f4]'
          }`}>
            {/* Theme Quick Switcher */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className={`text-[11px] font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Study Theme</span>
              <div className={`flex items-center p-0.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#212121] border-[#333]'
                  : theme === 'sepia'
                    ? 'bg-[#e2d8c7] border-[#d4c8b5]'
                    : 'bg-white border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  title="White Study Theme (Clean light mode)"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('sepia')}
                  title="Sepia Paper Mode (Warm study reading)"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    theme === 'sepia'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  title="Dark Mode"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* User Profile / Auth Button */}
            {user ? (
              <div 
                onClick={onOpenProfile}
                className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-[#212121] hover:bg-[#282828] border-[#333]'
                    : theme === 'sepia'
                      ? 'bg-[#f5efe6] hover:bg-[#eae0d0] border-[#d8ccb8]'
                      : 'bg-white hover:bg-gray-50 border-gray-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {user.email?.split('@')[0] || 'Student'}
                    </p>
                    <p className={`text-[10px] truncate ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>{user.email}</p>
                  </div>
                </div>
                <Settings className={`w-3.5 h-3.5 shrink-0 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                }`} />
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#212121] hover:bg-[#282828] text-gray-200 border-[#333]'
                    : theme === 'sepia'
                      ? 'bg-[#f5efe6] hover:bg-[#eae0d0] text-[#2c2722] border-[#d8ccb8]'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-xs'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sign in to sync notes</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
