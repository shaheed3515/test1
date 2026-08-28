import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Send, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **AI Docs Assistant**. How can I help you today?'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = { role: 'user', content: prompt.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ **Error:** ${data.error || 'Something went wrong'}` }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Network Error:** ${err.message}. Please verify backend is running on port 5000.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">AI Docs Assistant</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Connected to Gemini API
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?' }])}
            title="Clear Chat"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {!isUser ? (
                    <div className="prose prose-invert prose-sm max-w-none space-y-2 leading-relaxed break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre: ({ node, ...props }) => (
                            <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg overflow-x-auto text-xs my-2" {...props} />
                          ),
                          code: ({ node, inline, ...props }) => (
                            inline ? (
                              <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-xs" {...props} />
                            ) : (
                              <code {...props} />
                            )
                          ),
                          ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1" {...props} />,
                          a: ({ node, ...props }) => <a className="text-sky-400 underline hover:text-sky-300" target="_blank" rel="noreferrer" {...props} />,
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-slate-800 border border-slate-800 text-xs" {...props} /></div>,
                          th: ({ node, ...props }) => <th className="bg-slate-900 px-3 py-2 text-left font-semibold text-slate-300" {...props} />,
                          td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-800" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {/* Copy Button for Assistant */}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-white bg-slate-900/90 rounded-md border border-slate-700"
                      title="Copy response"
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
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-slate-400">Gemini is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-slate-800 p-4 bg-slate-900/50">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question or request code..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 text-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}