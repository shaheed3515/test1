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
  ArrowUp,
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
  HelpCircle,
  PanelLeft,
  PanelLeftClose,
  Download,
  ThumbsUp,
  Lightbulb,
  Calculator,
  Brain,
  Plus,
  Share2,
  ChevronDown
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { supabase } from './lib/supabase';

// Helper to format file sizes nicely
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const STARTER_PROMPTS = [
  {
    icon: BookOpen,
    title: 'Summarize Lecture Notes',
    description: 'Extract key takeaways, definitions, and core concepts from notes',
    prompt: 'Please provide a clear, structured summary of my notes with key definitions, core concepts, and takeaways.'
  },
  {
    icon: Brain,
    title: 'Generate Practice Quiz',
    description: 'Create 5 multiple choice questions with detailed explanations',
    prompt: 'Generate a 5-question multiple choice practice quiz based on our topic, with an answer key and explanations.'
  },
  {
    icon: Lightbulb,
    title: 'Explain Like I\'m 5',
    description: 'Break down a complex academic theory with simple analogies',
    prompt: 'Explain this concept simply using real-world analogies, step-by-step logic, and intuitive examples.'
  },
  {
    icon: Calculator,
    title: 'Step-by-Step Math Solver',
    description: 'Solve mathematical equations and physics problems step-by-step',
    prompt: 'Solve this problem step-by-step, showing all formulas, intermediate derivations in KaTeX, and the final answer.'
  }
];

const DEFAULT_WELCOME_MESSAGE = {
  role: 'assistant',
  content: `👋 **Welcome to your AI Study & Research Workspace!**

I am your personal academic study companion powered by Gemini AI. Here is how I can accelerate your learning:

- 📎 **Upload Study Materials:** Attach lecture PDFs, textbook chapters, research papers, or photos of your handwritten notes.
- 💡 **Deep Conceptual Learning:** Ask questions, request intuitive breakdowns, or explore tricky topics.
- 📝 **Exam & Quiz Prep:** Ask for flashcards, practice quizzes, and structured revision sheets.
- 📐 **Math & Science:** Get step-by-step LaTeX formula derivations and code explanations.

*Pick one of the quick study prompts below or attach your notes to get started!*`,
  attachments: []
};

// Code block with copy button
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-[#383838] bg-[#1e1e1e] text-gray-200 text-xs font-mono shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#2d2d2d] border-b border-[#383838] text-[11px] text-gray-400">
        <span className="font-semibold uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto">
        <code>{codeText}</code>
      </div>
    </div>
  );
}

export default function App() {
  // Theme state: 'light' (default white study), 'sepia' (paper study), 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('study_gpt_theme') || 'light';
  });

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
  const [likedMap, setLikedMap] = useState({});

  // UI Modals & responsive drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [studyMode, setStudyMode] = useState('Standard');

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('study_gpt_theme', theme);
  }, [theme]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_study_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  // Supabase Auth listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Active Session & Messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const isOnlyWelcome = messages.length === 1 && messages[0].role === 'assistant';

  // Auto-scroll chat to bottom
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

  // Export Study Notes as Markdown
  const handleExportSession = () => {
    if (!activeSession || messages.length === 0) return;
    
    let content = `# ${activeSession.title || 'Study Session Notes'}\n`;
    content += `*Generated by StudyGPT on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
    
    messages.forEach((msg) => {
      const speaker = msg.role === 'user' ? '👤 **Question / Prompt**' : '🤖 **Study Assistant Response**';
      content += `### ${speaker}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(activeSession.title || 'study_notes').replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File Upload Handlers
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum supported size is 15MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64Data = result.split(',')[1];
        
        setAttachments((prev) => [
          ...prev,
          {
            id: 'file-' + Math.random().toString(36).substring(2, 9),
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

  const handleToggleLike = (index) => {
    setLikedMap((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Send Message
  const handleSendMessage = async (textToSend, customAttachments = null) => {
    const messageText = (textToSend !== undefined ? textToSend : prompt).trim();
    const messageAttachments = customAttachments || attachments;

    if ((!messageText && messageAttachments.length === 0) || loading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      attachments: [...messageAttachments]
    };

    const isFirstUserMessage = !messages.some((m) => m.role === 'user');
    let updatedTitle = activeSession.title;
    if (isFirstUserMessage) {
      if (messageText) {
        updatedTitle = messageText.slice(0, 36) + (messageText.length > 36 ? '...' : '');
      } else if (messageAttachments.length > 0) {
        updatedTitle = `Doc: ${messageAttachments[0].name.slice(0, 24)}`;
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

    const sendingAttachments = messageAttachments.map((a) => ({
      mimeType: a.type,
      data: a.data,
      name: a.name
    }));

    setPrompt('');
    setAttachments([]);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
                      content: `⚠️ **Error:** ${data.error || 'Failed to process study request.'}`
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
                    content: `⚠️ **Connection Error:** ${err.message}. Please ensure the study backend server is running.`
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Colors & Theme Styling
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const themeClasses = isDark
    ? 'bg-[#212121] text-gray-100'
    : isSepia
      ? 'bg-[#fbf7ee] text-[#2c2722]'
      : 'bg-white text-gray-900';

  const headerBorderClass = isDark
    ? 'border-[#2f2f2f] bg-[#212121]/90'
    : isSepia
      ? 'border-[#e6dcce] bg-[#fbf7ee]/90'
      : 'border-gray-100 bg-white/90';

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${themeClasses} font-sans selection:bg-emerald-500/20`}>
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,application/pdf,text/*,.pdf,.png,.jpg,.jpeg,.txt,.md"
        className="hidden"
      />

      {/* Sidebar */}
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
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main ChatGPT Study Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Minimalist Top Bar */}
        <header className={`border-b px-4 py-2.5 flex items-center justify-between backdrop-blur-md shrink-0 z-10 transition-colors ${headerBorderClass}`}>
          <div className="flex items-center gap-2">
            {/* Sidebar Expand Button (Shown when sidebar is collapsed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-[#2e2e2e]' 
                    : isSepia
                      ? 'text-[#6b6255] hover:text-[#1c1917] hover:bg-[#eae0d0]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Open sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Quick New Chat Button (Shown when sidebar is collapsed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={handleNewSession}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-[#2e2e2e]' 
                    : isSepia
                      ? 'text-[#6b6255] hover:text-[#1c1917] hover:bg-[#eae0d0]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="New study session"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
              </button>
            )}

            {/* Model Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-[#2a2a2a] border-[#383838] text-gray-200'
                : isSepia
                  ? 'bg-[#f0e6d5] border-[#d8ccb8] text-[#2c2722]'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Study Assistant</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isDark ? 'bg-[#383838] text-gray-400' : 'bg-gray-200/80 text-gray-600'
              }`}>Gemini 3.6 Flash</span>
            </div>
          </div>

          {/* Right Header Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Export Notes button */}
            <button
              onClick={handleExportSession}
              title="Download Study Sheet as Markdown (.md)"
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-[#2e2e2e]' 
                  : isSepia
                    ? 'text-[#4d463d] hover:text-[#1c1917] hover:bg-[#eae0d0]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Notes</span>
            </button>

            {/* Reset Chat button */}
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
              title="Reset current chat"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-[#2e2e2e]' 
                  : isSepia
                    ? 'text-[#6b6255] hover:text-[#1c1917] hover:bg-[#eae0d0]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Messages Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            
            {/* If first welcome state, show Study Hero with Starter Cards */}
            {isOnlyWelcome && (
              <div className="pt-4 pb-6 text-center space-y-6 animate-fade-in">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs mb-1">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                    What do you want to learn today?
                  </h2>
                  <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-400' : isSepia ? 'text-[#6b6255]' : 'text-gray-500'}`}>
                    Upload textbooks, lecture notes, or PDF slides, or select a study prompt below to begin.
                  </p>
                </div>

                {/* 4 Interactive Starter Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {STARTER_PROMPTS.map((card, idx) => {
                    const IconComponent = card.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSendMessage(card.prompt)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
                          isDark
                            ? 'bg-[#292929] hover:bg-[#313131] border-[#383838] text-gray-200'
                            : isSepia
                              ? 'bg-[#f3ede2] hover:bg-[#ebe2d4] border-[#dfd4c3] text-[#2c2722]'
                              : 'bg-gray-50/70 hover:bg-white hover:border-gray-300 border-gray-200/80 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold mb-1 flex items-center gap-1">
                              {card.title}
                            </h3>
                            <p className={`text-[11px] leading-relaxed ${
                              isDark ? 'text-gray-400' : isSepia ? 'text-[#706659]' : 'text-gray-500'
                            }`}>
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3.5 text-sm ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Message Bubble / Container */}
                  <div
                    className={`relative group max-w-[88%] sm:max-w-[82%] leading-relaxed ${
                      isUser
                        ? isDark
                          ? 'bg-[#2f2f2f] text-gray-100 rounded-2xl px-4 py-3 shadow-xs'
                          : isSepia
                            ? 'bg-[#ede5d8] text-[#1c1917] rounded-2xl px-4 py-3 shadow-xs font-medium'
                            : 'bg-gray-100 text-gray-900 rounded-2xl px-4 py-3 shadow-xs'
                        : 'text-left pt-0.5 w-full'
                    }`}
                  >
                    {/* User Uploaded Document Badges */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {msg.attachments.map((att, attIdx) => {
                          const isImg = att.type?.startsWith('image/');
                          const isPdf = att.type?.includes('pdf') || att.name?.endsWith('.pdf');
                          return (
                            <div
                              key={attIdx}
                              className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl text-xs border ${
                                isDark
                                  ? 'bg-[#1e1e1e] border-[#383838]'
                                  : 'bg-white border-gray-200 shadow-xs'
                              }`}
                            >
                              {isImg && att.previewUrl ? (
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="w-9 h-9 object-cover rounded-lg"
                                />
                              ) : isPdf ? (
                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 font-bold text-[10px]">
                                  PDF
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="overflow-hidden text-left">
                                <p className="font-semibold truncate max-w-[130px] text-xs">{att.name}</p>
                                <p className="text-[10px] opacity-70">{formatBytes(att.size)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Markdown / Content Area */}
                    {!isUser ? (
                      <div className="space-y-3">
                        <div className={`prose prose-sm max-w-none break-words leading-relaxed ${
                          isDark ? 'prose-invert text-gray-200' : 'text-gray-800'
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code: ({ inline, className, children, ...props }) => {
                                if (!inline) {
                                  return (
                                    <CodeBlock className={className}>
                                      {children}
                                    </CodeBlock>
                                  );
                                }
                                return (
                                  <code className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
                                    isDark
                                      ? 'bg-[#333] text-emerald-400'
                                      : 'bg-gray-100 text-emerald-800 border border-gray-200/80'
                                  }`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: (props) => <p className="my-2 leading-relaxed" {...props} />,
                              h1: (props) => <h1 className="text-lg font-bold mt-4 mb-2 tracking-tight" {...props} />,
                              h2: (props) => <h2 className="text-base font-bold mt-3 mb-1.5 tracking-tight" {...props} />,
                              h3: (props) => <h3 className="text-sm font-bold mt-2.5 mb-1" {...props} />,
                              ul: (props) => <ul className="list-disc ml-5 space-y-1 my-2" {...props} />,
                              ol: (props) => <ol className="list-decimal ml-5 space-y-1 my-2" {...props} />,
                              blockquote: (props) => (
                                <blockquote className={`border-l-3 pl-3 my-2.5 italic ${
                                  isDark ? 'border-emerald-500 text-gray-300' : 'border-emerald-600 text-gray-700 bg-emerald-50/40 py-1 rounded-r-lg'
                                }`} {...props} />
                              ),
                              table: (props) => (
                                <div className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-[#383838]">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-[#383838] text-xs" {...props} />
                                </div>
                              ),
                              th: (props) => (
                                <th className={`px-3 py-2 text-left font-bold ${
                                  isDark ? 'bg-[#2a2a2a] text-gray-200' : 'bg-gray-50 text-gray-800'
                                }`} {...props} />
                              ),
                              td: (props) => (
                                <td className={`px-3 py-2 border-t ${
                                  isDark ? 'border-[#383838] text-gray-300' : 'border-gray-100 text-gray-700'
                                }`} {...props} />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Assistant Response Action Toolbar */}
                        <div className="flex items-center gap-1 pt-1 text-gray-400">
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            title="Copy response"
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                              isDark ? 'hover:text-white hover:bg-[#2a2a2a]' : 'hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleToggleLike(index)}
                            title="Mark helpful"
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                              likedMap[index] ? 'text-emerald-600' : isDark ? 'hover:text-white hover:bg-[#2a2a2a]' : 'hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const prevUserMsg = messages.slice(0, index).reverse().find((m) => m.role === 'user');
                              if (prevUserMsg) {
                                handleSendMessage(prevUserMsg.content, prevUserMsg.attachments);
                              }
                            }}
                            title="Regenerate explanation"
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                              isDark ? 'hover:text-white hover:bg-[#2a2a2a]' : 'hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[11px] hidden sm:inline">Retry</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3.5 text-sm justify-start animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className={`rounded-2xl px-4 py-3 flex items-center gap-2 text-xs border shadow-xs ${
                  isDark
                    ? 'bg-[#292929] border-[#383838] text-gray-300'
                    : isSepia
                      ? 'bg-[#ede5d8] border-[#dfd4c3] text-[#2c2722]'
                      : 'bg-white border-gray-200 text-gray-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1.5 font-medium">Analyzing notes and generating solution...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ChatGPT-Style Floating Multiline Input Box Area */}
        <div className="p-3 sm:p-4 bg-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            
            {/* Input Wrapper Container */}
            <div className={`relative rounded-3xl border transition-all shadow-md focus-within:shadow-lg ${
              isDark
                ? 'bg-[#2f2f2f] border-[#3e3e3e] focus-within:border-[#555]'
                : isSepia
                  ? 'bg-white border-[#d8ccb8] focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-700/10'
                  : 'bg-white border-gray-300/90 focus-within:border-gray-400 focus-within:ring-3 focus-within:ring-black/5'
            }`}>
              
              {/* Attachment Preview Chips inside/above input */}
              {attachments.length > 0 && (
                <div className="p-2.5 pb-0 flex flex-wrap gap-2 border-b border-gray-100 dark:border-[#3a3a3a]">
                  {attachments.map((att) => {
                    const isImg = att.type?.startsWith('image/');
                    const isPdf = att.type?.includes('pdf') || att.name?.endsWith('.pdf');
                    return (
                      <div
                        key={att.id}
                        className={`flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl text-xs border shadow-xs ${
                          isDark
                            ? 'bg-[#212121] border-[#3e3e3e] text-gray-200'
                            : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      >
                        {isImg ? (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isPdf ? (
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <File className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                        <span className="text-[10px] text-gray-400">({formatBytes(att.size)})</span>
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Form Bar */}
              <div className="flex items-end gap-2 p-2 sm:p-2.5">
                
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title="Upload PDF, textbook chapter, photo of notes"
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                    isDark
                      ? 'text-gray-400 hover:text-white hover:bg-[#3e3e3e]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Multiline Textarea */}
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    attachments.length > 0
                      ? "Ask a question about the attached document..."
                      : "Ask anything, explain concepts, paste textbook problems, or upload notes..."
                  }
                  disabled={loading}
                  className={`flex-1 max-h-[180px] bg-transparent border-0 focus:outline-none focus:ring-0 p-1.5 text-sm resize-none leading-relaxed transition-colors ${
                    isDark
                      ? 'text-white placeholder-gray-500'
                      : 'text-gray-900 placeholder-gray-400'
                  }`}
                />

                {/* Circular Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || (!prompt.trim() && attachments.length === 0)}
                  className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs ${
                    prompt.trim() || attachments.length > 0
                      ? 'bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200'
                      : 'bg-gray-200 text-gray-400 dark:bg-[#3e3e3e] dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

            </div>

            {/* Bottom Caption */}
            <div className={`mt-2 text-center text-[11px] ${
              isDark ? 'text-gray-500' : isSepia ? 'text-[#7e7364]' : 'text-gray-500'
            }`}>
              StudyGPT can make mistakes. Verify critical academic formulas and textbook facts.
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
        theme={theme}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onSignOut={() => setUser(null)}
        onClearAllHistory={handleClearAllHistory}
        theme={theme}
      />

    </div>
  );
}