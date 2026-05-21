import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../utils/apiClient';

export default function AIAssistant() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Initializing DonorNet AI...` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const checkUrgency = async () => {
      try {
        const res = await fetchAPI(`/api/requests/nearby?zipCode=${user?.profile?.zipCode || '90210'}`);
        const data = await res.json();
        const count = data.length;
        
        let intro = `Hello ${user?.profile?.name || ''}! I'm the DonorNet AI assistant. `;
        if (count > 0) {
          intro += `I've scanned the network and noticed **${count} urgent blood requests** in your immediate area that match your blood type. How can I help you today?`;
        } else {
          intro += `I've checked the local network and everything looks stable right now. How can I assist you with your donation journey today?`;
        }
        
        setMessages([{ role: 'assistant', text: intro }]);
      } catch (err) {
        setMessages([{ role: 'assistant', text: `Hello! I'm the DonorNet AI. I can help you with eligibility, preparation, or finding nearby needs. What's on your mind?` }]);
      }
    };
    if (user) checkUrgency();
  }, [user]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll when a new message arrives (assistant replied)
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    
    // Scroll slightly to show user message but don't jump aggressively
    setTimeout(() => scrollToBottom('smooth'), 100);

    setLoading(true);

    try {
      const res = await fetchAPI('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', text: "⏳ I'm a little overwhelmed right now — please wait a few seconds and try again!" }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I'm experiencing a temporary issue. Please try again in a moment." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Network error. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', text: 'Chat history cleared. What else can I help you with?' }]);
  };

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#141414] pt-28 pb-10 px-6 overflow-hidden flex flex-col transition-colors duration-500">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-4xl w-full mx-auto flex-1 flex flex-col z-10 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 px-4">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-neutral-900 dark:bg-[#141414] dark:border dark:border-[#2a2a2a] rounded-2xl flex items-center justify-center shadow-xl dark:shadow-none">
                 <Bot className="w-8 h-8 text-crimson-500" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-neutral-900 dark:text-white font-header tracking-tight transition-colors">AI Assistant</h1>
                 <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Always Online
                 </p>
              </div>
           </div>
           <button onClick={clearChat} className="w-12 h-12 rounded-xl bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] text-neutral-400 dark:text-neutral-500 hover:text-crimson-600 dark:hover:text-crimson-500 hover:border-crimson-100 dark:hover:border-[#333] transition-all flex items-center justify-center active:scale-90">
              <Trash2 className="w-5 h-5" />
           </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass dark:!bg-[#0a0a0a] dark:!border-[#141414] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl dark:shadow-none shadow-neutral-200/50 dark:shadow-none transition-colors duration-500">
           <div 
             ref={scrollContainerRef}
             className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
           >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                   <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm dark:shadow-none ${
                        msg.role === 'user' ? 'bg-neutral-800 dark:bg-[#2a2a2a] text-white' : 'bg-crimson-600 text-white shadow-crimson-100 dark:shadow-none'
                      }`}>
                         {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      </div>
                      <div className={`p-6 rounded-[2rem] text-[15px] font-medium leading-relaxed shadow-sm dark:shadow-none transition-all hover:shadow-md ${
                        msg.role === 'user' 
                          ? 'bg-neutral-900 dark:bg-[#141414] text-white rounded-tr-none' 
                          : 'bg-white dark:bg-[#141414] text-neutral-800 dark:text-neutral-300 border border-neutral-100 dark:border-[#2a2a2a] rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                   </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in-up">
                   <div className="flex gap-4 max-w-[80%]">
                      <div className="w-10 h-10 rounded-xl bg-crimson-600 text-white flex items-center justify-center shrink-0">
                         <Bot className="w-5 h-5" />
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] text-neutral-400 dark:text-neutral-500 text-sm rounded-tl-none flex items-center gap-3 shadow-sm dark:shadow-none">
                         <div className="w-2 h-2 rounded-full bg-crimson-300 animate-bounce" />
                         <div className="w-2 h-2 rounded-full bg-crimson-400 animate-bounce delay-100" />
                         <div className="w-2 h-2 rounded-full bg-crimson-500 animate-bounce delay-200" />
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Input Tool Bar */}
           <div className="px-8 pb-8 pt-4 bg-white/50 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-neutral-100 dark:border-[#141414] transition-colors duration-500">
              <form onSubmit={handleSend} className="relative group">
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   placeholder="Type your question about donation..."
                   className="w-full pl-8 pr-20 py-6 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#2a2a2a] rounded-[2rem] focus:border-crimson-500 focus:ring-8 focus:ring-crimson-500/5 dark:focus:ring-crimson-500/10 outline-none text-base font-semibold transition-all shadow-inner dark:shadow-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                   disabled={loading}
                 />
                 <button 
                   type="submit"
                   disabled={!input.trim() || loading}
                   className="absolute right-3 top-3 bottom-3 w-14 bg-neutral-900 dark:bg-[#2a2a2a] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-crimson-600 dark:hover:bg-crimson-600 disabled:opacity-30 disabled:hover:bg-neutral-900 dark:disabled:hover:bg-[#2a2a2a] transition-all shadow-xl dark:shadow-none active:scale-95"
                 >
                   <Send className="w-5 h-5 ml-1 group-focus-within:translate-x-1 group-focus-within:-translate-y-1 transition-transform" />
                 </button>
              </form>
              <div className="mt-4 flex items-center justify-between px-4">
                 <div className="flex items-center gap-6">
                    <button type="button" onClick={() => setInput("Who can donate blood?")} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 hover:text-crimson-600 dark:hover:text-crimson-500 transition-colors uppercase tracking-widest">Eligibility</button>
                    <button type="button" onClick={() => setInput("How to prepare for donation?")} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 hover:text-crimson-600 dark:hover:text-crimson-500 transition-colors uppercase tracking-widest">Preparation</button>
                    <button type="button" onClick={() => setInput("Benefits of donating blood?")} className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 hover:text-crimson-600 dark:hover:text-crimson-500 transition-colors uppercase tracking-widest">Benefits</button>
                 </div>
                 <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                    <MessageSquare className="w-3 h-3" />
                    Powered by DonorNet AI
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
