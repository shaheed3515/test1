import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Bot, 
  User, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Menu,
  BookOpen,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { supabase } from './lib/supabase';

// Helper to format file sizes nicely
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const DEFAULT_WELCOME_MESSAGE = {
  role: 'assistant',
  content: `👋 Welcome to your **AI Study Assistant** (NotebookLM for Students)!

I can help you study faster, understand complex materials, and test your knowledge:
- 📎 **Upload Documents:** Click the paperclip icon below to attach textbooks, lecture PDFs, research papers, or photos of your handwritten notes.
- 💡 **Contextual Q&A:** Ask questions grounded in your notes or request simple explanations of difficult concepts.
- 📝 **Exam Prep:** Ask me to generate practice quizzes, flashcards, or step-by-step summaries.`,
  attachments: []
};

export default function App() {
  // Session storage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_study_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
    const initialId = 'session-' + Date.now();
    return [{
      id: initialId,
      title: 'Welcome & Study Guide',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_WELCOME_MESSAGE]
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || 'default');

  // Input & attachments
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // UI Modals & responsive drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_study_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Supabase Auth listener
  useEffect(() => {
    if (!supabase) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-scroll chat to bottom
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Session Handlers
  const handleNewSession = () => {
    const newId = 'session-' + Date.now();
    const newSession = {
      id: newId,
      title: 'New Study Session',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_WELCOME_MESSAGE]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setAttachments([]);
    setPrompt('');
  };

  const handleDeleteSession = (id) => {
    if (sessions.length <= 1) {
      // Reset only session
      handleNewSession();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleClearAllHistory = () => {
    localStorage.removeItem('ai_study_sessions');
    const newId = 'session-' + Date.now();
    const fresh = [{
      id: newId,
      title: 'New Study Session',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_WELCOME_MESSAGE]
    }];
    setSessions(fresh);
    setActiveSessionId(newId);
  };

  // File Upload Handlers (Paperclip / Pin)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      // Check size limit: 15MB
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max size is 15MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Extract raw base64 data without prefix (e.g. data:image/png;base64,)
        const base64Data = result.split(',')[1];
        
        setAttachments((prev) => [
          ...prev,
          {
            id: 'file-' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            data: base64Data,
            previewUrl: file.type.startsWith('image/') ? result : null
          }
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so user can attach same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Send Message with Attachments
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || loading) return;

    const userMessage = {
      role: 'user',
      content: prompt.trim(),
      attachments: [...attachments]
    };

    // Auto-update session title if it's the first user question
    const isFirstUserMessage = !messages.some((m) => m.role === 'user');
    let updatedTitle = activeSession.title;
    if (isFirstUserMessage) {
      if (prompt.trim()) {
        updatedTitle = prompt.trim().slice(0, 32) + (prompt.length > 32 ? '...' : '');
      } else if (attachments.length > 0) {
        updatedTitle = `Doc: ${attachments[0].name.slice(0, 24)}`;
      }
    }

    const nextMessages = [...messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: updatedTitle, messages: nextMessages }
          : s
      )
    );

    const sendingAttachments = attachments.map((a) => ({
      mimeType: a.type,
      data: a.data,
      name: a.name
    }));

    setPrompt('');
    setAttachments([]);
    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          attachments: sendingAttachments
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: [
                    ...nextMessages,
                    { role: 'assistant', content: data.reply }
                  ]
                }
              : s
          )
        );
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: [
                    ...nextMessages,
                    {
                      role: 'assistant',
                      content: `⚠️ **Error:** ${data.error || 'Failed to process request.'}`
                    }
                  ]
                }
              : s
          )
        );
      }
    } catch (err) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [
                  ...nextMessages,
                  {
                    role: 'assistant',
                    content: `⚠️ **Network Error:** ${err.message}. Please check your backend connection.`
                  }
                ]
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,application/pdf,text/*,.pdf,.png,.jpg,.jpeg,.txt,.md"
        className="hidden"
      />

      {/* Sidebar (History, Sessions, Auth) */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Study Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        
        {/* Workspace Top Header */}
        <header className="border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl"
              title="Open History"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-md shadow-sky-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {activeSession?.title || 'Study Assistant'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Gemini 3.6 Flash Active</span>
                {user && (
                  <>
                    <span>•</span>
                    <span className="text-sky-400 truncate max-w-[150px]">{user.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Reset this conversation?')) {
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? { ...s, messages: [DEFAULT_WELCOME_MESSAGE] }
                        : s
                    )
                  );
                }
              }}
              title="Clear current chat"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3.5 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-sky-500/15">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3.5 shadow-sm ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-xs'
                        : 'bg-slate-900 border border-slate-800/90 text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {/* User Attached Document Badges / Photos */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {msg.attachments.map((att, attIdx) => {
                          const isImg = att.type?.startsWith('image/');
                          const isPdf = att.type?.includes('pdf') || att.name?.endsWith('.pdf');
                          return (
                            <div
                              key={attIdx}
                              className="flex items-center gap-2 p-1.5 pr-3 bg-black/25 border border-white/10 rounded-xl text-xs"
                            >
                              {isImg && att.previewUrl ? (
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : isPdf ? (
                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                                  PDF
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="overflow-hidden text-left">
                                <p className="font-medium text-white truncate max-w-[130px]">{att.name}</p>
                                <p className="text-[10px] text-slate-300 opacity-80">{formatBytes(att.size)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Content Rendering */}
                    {!isUser ? (
                      <div className="prose prose-invert prose-sm max-w-none space-y-2.5 leading-relaxed break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            pre: ({ node, ...props }) => (
                              <pre className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl overflow-x-auto text-xs my-2 font-mono" {...props} />
                            ),
                            code: ({ node, inline, ...props }) => (
                              inline ? (
                                <code className="bg-slate-800/80 text-sky-300 px-1.5 py-0.5 rounded text-xs" {...props} />
                              ) : (
                                <code {...props} />
                              )
                            ),
                            ul: ({ node, ...props }) => <ul className="list-disc ml-5 space-y-1 my-1.5" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal ml-5 space-y-1 my-1.5" {...props} />,
                            a: ({ node, ...props }) => <a className="text-sky-400 underline hover:text-sky-300" target="_blank" rel="noreferrer" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-3"><table className="min-w-full divide-y divide-slate-800 border border-slate-800 text-xs" {...props} /></div>,
                            th: ({ node, ...props }) => <th className="bg-slate-950 px-3 py-2 text-left font-semibold text-slate-200" {...props} />,
                            td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-800 text-slate-300" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-white bg-slate-950/80 rounded-lg border border-slate-800"
                        title="Copy text"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3.5 text-sm justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 text-slate-300 flex items-center gap-2.5 text-xs shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-slate-400">Analyzing notes with Gemini 3.6...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Bar & Attachment Chips Area */}
        <div className="border-t border-slate-800/80 p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">

            {/* Pending Attachment Chips (Preview before send) */}
            {attachments.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-2 p-2 bg-slate-950/60 border border-slate-800 rounded-xl">
                {attachments.map((att) => {
                  const isImg = att.type?.startsWith('image/');
                  const isPdf = att.type?.includes('pdf') || att.name?.endsWith('.pdf');
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white shadow-xs"
                    >
                      {isImg ? (
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      ) : isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                      <span className="text-[10px] text-slate-400">({formatBytes(att.size)})</span>
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              
              {/* Attachment Button (Paperclip / Pin 📎) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Attach PDF, Photos, or Notes"
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-sky-500/50 text-slate-300 hover:text-sky-400 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  attachments.length > 0
                    ? "Ask a question about the attached document..."
                    : "Ask a study question, request an explanation, or upload notes..."
                }
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 text-white transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || (!prompt.trim() && attachments.length === 0)}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-semibold p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md shadow-sky-500/10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Supports PDFs, Photos, Textbook chapters & Lecture notes</span>
              <span className="hidden sm:inline">NotebookLM Assistant</span>
            </div>

          </div>
        </div>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setIsAuthOpen(false);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onSignOut={() => setUser(null)}
        onClearAllHistory={handleClearAllHistory}
      />

    </div>
  );
}