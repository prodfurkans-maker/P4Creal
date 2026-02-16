
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message, ChatSession } from './types.ts';
import { getP4CResponse, generateTitle } from './services/geminiService.ts';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ng_sessions_p4c_v10');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAiMessageRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  const LOGO_URL = "https://lh3.googleusercontent.com/d/1iuS4shzoEIy9xsMHhm7AUyMKmuZ9WCgp";
  const SECOND_LOGO_URL = "https://lh3.googleusercontent.com/d/1IXK9E888uqex4wBK1VYBb6byBHFKRe3E";

  useEffect(() => {
    localStorage.setItem('ng_sessions_p4c_v10', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSession?.messages && activeSession.messages.length > 0) {
      const lastMsg = activeSession.messages[activeSession.messages.length - 1];
      
      if (lastMsg.role === 'assistant' && lastAiMessageRef.current) {
        setTimeout(() => {
          lastAiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      } else if (lastMsg.role === 'user' && scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() && !customInput) return;
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || "Keşfe başlayalım!",
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: "Yeni Sorgulama", messages: [userMsg], createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;
    } else {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    }

    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = activeSession ? activeSession.messages : [];
      const data = await getP4CResponse(messageText, chatHistory);
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: '', 
        timestamp: Date.now(), 
        data 
      };

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
      
      if (chatHistory.length === 0) {
        generateTitle(data.question).then(title => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden font-sans text-slate-100">
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full bg-slate-900/40 border-r border-white/5 backdrop-blur-xl">
          <Sidebar 
            sessions={sessions} activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={() => { handleNewChat(); setIsSidebarOpen(false); }}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-0 md:p-6 lg:p-8 relative z-10 h-full overflow-hidden">
        <div className="w-full max-w-5xl h-full flex flex-col md:glass-card md:rounded-[3rem] overflow-hidden bg-slate-900/40 border-white/5 shadow-2xl">
          
          <header className="flex items-center justify-between px-6 py-4 md:px-12 shrink-0 z-30 border-b border-white/5 backdrop-blur-md bg-slate-950/20">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-white/40 hover:text-white transition-all hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-8 flex-1 justify-center">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt="L1" className="w-8 h-8 md:w-11 md:h-11 object-contain bg-white rounded-xl p-1.5 shadow-md" />
                <span className="font-black text-[10px] md:text-sm uppercase tracking-tighter text-white/80">NEXTGENLAB</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-3 hidden md:flex">
                <img src={SECOND_LOGO_URL} alt="L2" className="w-8 h-8 md:w-11 md:h-11 object-contain bg-white rounded-xl p-1.5 shadow-md" />
                <span className="font-black text-[10px] md:text-sm uppercase tracking-widest text-white/80">P4C</span>
              </div>
            </div>

            <button onClick={() => handleNewChat()} className="p-3 text-white/40 hover:text-white transition-all hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-10 animate-in fade-in zoom-in duration-700">
                <div className="space-y-12 hero-float w-full max-w-3xl">
                  <h2 className="text-[3rem] md:text-[6rem] font-[1000] leading-[1] tracking-tightest">
                    Düşün, Sor.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  <div className="flex flex-col items-center gap-12">
                    <div className="bg-white/5 inline-flex items-center gap-5 px-10 py-4 rounded-full border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.1)]">
                      <span className="w-4 h-4 bg-sky-400 rounded-full animate-pulse shadow-[0_0_25px_#38bdf8]"></span>
                      <p className="text-[10px] md:text-xl font-black uppercase tracking-[0.4em] text-sky-200 italic">P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ</p>
                    </div>
                    <button 
                      onClick={() => handleSend("Hadi başlayalım!")}
                      className="glow-button px-24 py-8 rounded-full text-white font-[1000] text-lg md:text-4xl tracking-tight transition-all active:scale-95 hover:scale-105 shadow-[0_25px_80px_-15px_rgba(99,102,241,0.7)]"
                    >
                      Keşfe Başla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-20 py-10 space-y-12 md:space-y-20">
                {activeSession.messages.map((msg, idx) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-12 duration-500`}
                  >
                    <div className={`max-w-[96%] md:max-w-[85%] px-7 py-6 md:px-14 md:py-12 rounded-3xl md:rounded-[4rem] shadow-2xl ${
                      msg.role === 'user' ? 'chat-bubble-user font-bold' : 'chat-bubble-ai'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-xl md:text-3xl leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-10 md:space-y-16" ref={idx === activeSession.messages.length - 1 ? lastAiMessageRef : null}>
                          {msg.data?.storyContent && msg.data.storyContent.trim() !== "" && (
                            <div className="bg-white/5 p-8 md:p-14 rounded-3xl border border-white/5 shadow-inner">
                              <label className="text-[9px] md:text-[12px] font-black text-sky-400 uppercase tracking-widest block mb-5 opacity-60">HİKAYE GEÇİDİ</label>
                              <p className="text-lg md:text-2xl font-medium leading-relaxed italic text-slate-200">{msg.data.storyContent}</p>
                            </div>
                          )}
                          
                          {msg.data?.reflection && (
                            <div className="pl-6 border-l-[6px] border-indigo-500/50">
                              <label className="text-[9px] md:text-[12px] font-black text-indigo-300 uppercase tracking-widest block mb-3 opacity-60">EĞİTMEN ANALİZİ</label>
                              <p className="text-2xl md:text-4xl font-black text-white leading-tight">"{msg.data.reflection}"</p>
                            </div>
                          )}

                          {msg.data?.question && (
                            <div className="p-10 md:p-16 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl md:rounded-[5rem] relative overflow-hidden shadow-2xl transition-all duration-300 hover:bg-indigo-500/20">
                              <div className="absolute top-0 left-0 w-3 h-full bg-indigo-500"></div>
                              <label className="text-[10px] md:text-[14px] font-black text-indigo-400 uppercase tracking-widest block mb-8">DERİN SORGULAMA</label>
                              <p className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">{msg.data.question}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 text-indigo-400 px-12 items-center opacity-40">
                    <span className="w-3.5 h-3.5 bg-white rounded-full animate-bounce"></span>
                    <span className="w-3.5 h-3.5 bg-white rounded-full animate-bounce delay-150"></span>
                    <span className="w-3.5 h-3.5 bg-white rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeSessionId && (
            <footer className="px-6 py-8 md:px-20 md:py-12 shrink-0 z-40 bg-slate-950/40 backdrop-blur-3xl border-t border-white/5">
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-full p-3 transition-all hover:bg-white/10 shadow-2xl">
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Düşünceni buraya yaz..."
                  className="flex-1 max-h-32 md:max-h-48 py-4 px-8 md:px-14 bg-transparent border-none focus:ring-0 text-lg md:text-xl font-bold text-white placeholder:text-white/20 resize-none no-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  className={`p-5 md:p-9 rounded-2xl md:rounded-full transition-all ${
                    input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-2xl scale-100 active:scale-90 hover:bg-indigo-500' : 'bg-white/5 text-white/5'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="md:w-10 md:h-10"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
              <p className="text-[10px] md:text-[12px] text-white/10 text-center mt-6 uppercase tracking-[0.8em] font-black italic">NEXTGENLAB – TÜM SİSTEMLER OPTİMİZE EDİLDİ</p>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
