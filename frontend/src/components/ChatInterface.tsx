import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  User, 
  Bot, 
  Sparkles, 
  RefreshCcw, 
  Paperclip, 
  Mic, 
  Info,
  ChevronRight,
  Database,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/v1';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "I'm your enterprise data copilot. I have indexed all your schemas and I'm ready to help you navigate your data landscape. You can ask me to explain tables, write complex joins, or find data anomalies." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSqlMode, setIsSqlMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    if (isSqlMode) {
      try {
        const res = await axios.post(`${API_BASE}/sql`, { query: currentInput });
        setMessages(prev => [...prev, { role: 'bot', content: res.data.response }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'bot', content: 'SQL Generation encountered an error.' }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Streaming for Chat Mode
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";
      
      // Add empty bot message to start streaming into
      setMessages(prev => [...prev, { role: 'bot', content: "" }]);
      setLoading(false); // Stop main loader once stream starts

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        botResponse += chunk;
        
        // Update the last message (the bot's streaming response)
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = botResponse;
          return newMsgs;
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Communication error. Please ensure the backend is available.' }]);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex gap-8">
      {/* Left Sidebar: Context & Shortcuts */}
      <div className="hidden xl:flex flex-col w-64 space-y-6">
        <div className="bg-white p-6 rounded-[28px] shadow-soft border border-surface-100">
           <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">Active Context</h3>
           <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-brand-50 rounded-xl text-brand-600">
                <Database size={16} />
                <span className="text-xs font-bold">Production DB</span>
              </div>
              <div className="flex items-center gap-3 p-2 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer">
                <Info size={16} />
                <span className="text-xs font-bold">Schema Docs</span>
              </div>
           </div>
        </div>

        <div className="bg-brand-600 p-6 rounded-[28px] shadow-elevated text-white">
           <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Pro Tip</p>
           <p className="text-xs leading-relaxed font-medium text-brand-50">
             Try: "List all tables related to customer orders and their primary keys."
           </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-soft border border-surface-100 overflow-hidden relative">
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-surface-50 flex justify-between items-center bg-white/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl transition-colors ${isSqlMode ? 'bg-indigo-600 shadow-indigo-600/10' : 'bg-surface-900 shadow-surface-900/10'}`}>
              {isSqlMode ? <Code size={20} /> : <Sparkles size={20} className="text-brand-400" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900 tracking-tight">Gemini 2.0 Copilot</h3>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Streaming Engine Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSqlMode(!isSqlMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${isSqlMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'}`}
            >
              <Code size={14} /> SQL Mode
            </button>
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-2.5 hover:bg-surface-50 rounded-xl text-surface-300 hover:text-surface-600 transition-all"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface-50/20">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-white border-brand-100' : 'bg-surface-900 border-surface-900'}`}>
                  {msg.role === 'user' ? <User size={18} className="text-brand-600" /> : <Bot size={18} className="text-brand-400" />}
                </div>
                <div className={`p-5 rounded-[24px] shadow-soft text-sm leading-relaxed font-medium ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-white text-surface-700 border border-surface-50 rounded-tl-none'
                }`}>
                  {msg.content.includes("SELECT") || msg.content.includes("CREATE") ? <pre className="font-mono text-xs overflow-x-auto">{msg.content}</pre> : msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-5">
                <div className="w-9 h-9 rounded-xl bg-surface-900 flex items-center justify-center shrink-0 shadow-xl shadow-surface-900/10">
                  <Bot size={18} className="text-brand-400" />
                </div>
                <div className="bg-white px-6 py-4 rounded-[24px] rounded-tl-none border border-surface-50 shadow-soft flex items-center gap-2">
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full"></motion.span>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full"></motion.span>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-400 rounded-full"></motion.span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="p-8 bg-white border-t border-surface-50">
          <form onSubmit={sendMessage} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2 border-r border-surface-100">
               <Paperclip size={18} className="text-surface-300 hover:text-surface-500 cursor-pointer transition-colors" />
            </div>
            <input 
              className="w-full pl-16 pr-32 py-5 bg-surface-50 border border-surface-200 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all text-sm font-medium" 
              placeholder={isSqlMode ? "Describe the query you need (e.g. 'Show me top customers by revenue')..." : "Query your enterprise data landscape..."}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
               <Mic size={18} className="text-surface-300 hover:text-surface-500 cursor-pointer hidden sm:block" />
               <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 bg-surface-900 text-white rounded-2xl hover:bg-brand-600 disabled:opacity-30 transition-all shadow-xl shadow-surface-900/10 flex items-center gap-2 group-hover:px-6"
              >
                {!loading && <span className="hidden group-hover:block text-xs font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">{isSqlMode ? 'Generate SQL' : 'Ask Copilot'}</span>}
                {loading ? <RefreshCcw size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
