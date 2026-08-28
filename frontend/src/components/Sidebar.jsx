import { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Search, 
  User, 
  LogIn, 
  Sparkles, 
  X,
  Settings,
  ChevronLeft,
  ChevronRight
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
  onToggle
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    (s.title || 'Untitled Session').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-950/95 md:bg-slate-900/60 backdrop-blur-md border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">AI Study Assistant</h1>
              <p className="text-[11px] text-slate-400">NotebookLM for Students</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onToggle();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-sky-500 focus:outline-none rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
            Recent Sessions ({filteredSessions.length})
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No study chats found. Click <b className="text-slate-300">New Study Chat</b> to begin.
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
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-sky-500/15 border border-sky-500/30 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="truncate flex-1">
                    {session.title || 'New Study Session'}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete session"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User Profile / Auth Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          {user ? (
            <div 
              onClick={onOpenProfile}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 border border-slate-800/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-white truncate">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <Settings className="w-4 h-4 text-slate-400 hover:text-white shrink-0" />
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Sign In / Sync History</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
