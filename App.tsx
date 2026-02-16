
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message, ChatSession } from './types.ts';
import { getP4CResponse, generateTitle } from './services/geminiService.ts';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ng_sessions_p4c_v5');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  const LOGO_URL = "https://lh3.googleusercontent.com/d/1iuS4shzoEIy9xsMHhm7AUyMKmuZ9WCgp";
  const SECOND_LOGO_URL = "https://lh3.googleusercontent.com/d/1IXK9E888uqex4wBK1VYBb6byBHFKRe3E";

  useEffect(() => {
    localStorage.setItem('ng_sessions_p4c_v5', JSON.stringify(sessions));
  }, [sessions]);

  // Akıllı Kaydırma: Yeni AI mesajı geldiğinde, mesajın başladığı noktaya odaklan
  useEffect(() => {
    if (activeSession?.messages && activeSession.messages.length > 0) {
      const lastMsg = activeSession.messages[activeSession.messages.length - 1];
      
      if (lastMsg.role === 'assistant' && lastMessageRef.current) {
        // Yumuşak bir geçişle mesajın başına odaklan
        setTimeout(() => {
          lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else if (lastMsg.role === 'user' && scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
    setIsSidebarOpen(false);
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() && !customInput) return;
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || "Hadi başlayalım!",
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: "Yeni Keşif", messages: [userMsg], createdAt: Date.now() };
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
      {/* Sidebar - Mobil Uyumlu */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full bg-slate-900/40 border-r border-white/5 backdrop-blur-xl">
          <Sidebar 
            sessions={sessions} activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-0 md:p-4 relative z-10 h-full overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col md:glass-card md:rounded-[2rem] overflow-hidden bg-slate-900/60 md:bg-transparent shadow-2xl transition-all duration-300">
          
          <header className="flex items-center justify-between px-4 py-3 md:px-8 md:py-6 shrink-0 z-30 border-b border-white/5 backdrop-blur-md">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-3 md:gap-6 flex-1 justify-center">
              <div className="flex items-center gap-2 shrink-0">
                <img src={LOGO_URL} alt="L1" className="w-7 h-7 md:w-12 md:h-12 object-contain bg-white rounded-lg p-1" />
                <span className="font-black text-[9px] md:text-[13px] uppercase tracking-tighter text-white/80">NEXTGENLAB</span>
              </div>
              <div className="h-5 w-[1px] bg-white/10"></div>
              <div className="flex items-center gap-2 shrink-0">
                <img src={SECOND_LOGO_URL} alt="L2" className="w-7 h-7 md:w-12 md:h-12 object-contain bg-white rounded-lg p-1" />
                <span className="font-black text-[9px] md:text-[13px] uppercase tracking-widest text-white/80">P4C</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-700">
                <div className="space-y-8 hero-float w-full max-w-lg">
                  <h2 className="text-[2.5rem] md:text-8xl font-[1000] leading-[1] tracking-tightest">
                    Düşün, Sor.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  <div className="flex flex-col items-center gap-8">
                    <div className="bg-white/5 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_15px_#38bdf8]"></span>
                      <p className="text-[9px] md:text-sm font-black uppercase tracking-[0.3em] text-sky-100">P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ</p>
                    </div>
                    <button 
                      onClick={() => handleSend("Keşfe başlayalım!")}
                      className="glow-button px-14 py-6 rounded-full text-white font-black text-xs md:text-2xl tracking-tight transition-all active:scale-95"
                    >
                      Keşfe Başla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-3 md:px-12 py-6 space-y-8 md:space-y-14">
                {activeSession.messages.map((msg, idx) => (
                  <div 
                    key={msg.id} 
                    ref={idx === activeSession.messages.length - 1 ? lastMessageRef : null}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-400`}
                  >
                    <div className={`max-w-[92%] md:max-w-[85%] px-5 py-4 md:px-12 md:py-10 rounded-2xl md:rounded-[3rem] ${
                      msg.role === 'user' ? 'chat-bubble-user font-bold' : 'chat-bubble-ai'
                    }`}>
                      {msg.role === 'user' ? <p className="text-base md:text-3xl leading-relaxed">{msg.content}</p> : (
                        <div className="space-y-8 md:space-y-12">
                          {msg.data?.storyContent && msg.data.storyContent.trim() !== "" && (
                            <div className="bg-white/5 p-5 md:p-10 rounded-2xl border border-white/5 shadow-inner">
                              <label className="text-[8px] md:text-[11px] font-black text-sky-400 uppercase tracking-widest block mb-3 opacity-60 italic">HİKAYE BAŞLANGICI</label>
                              <p className="text-base md:text-3xl font-medium leading-relaxed italic text-slate-100">{msg.data.storyContent}</p>
                            </div>
                          )}
                          
                          {msg.data?.reflection && (
                            <div className="pl-4 border-l-2 border-indigo-500/50">
                              <label className="text-[8px] md:text-[11px] font-black text-indigo-300 uppercase tracking-widest block mb-2 opacity-60">ANALİZ</label>
                              <p className="text-xl md:text-4xl font-black text-white leading-tight">"{msg.data.reflection}"</p>
                            </div>
                          )}

                          {msg.data?.question && (
                            <div className="p-6 md:p-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl md:rounded-[4rem] relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                              <label className="text-[9px] md:text-[13px] font-black text-indigo-400 uppercase tracking-widest block mb-4">SORGULAMA SORUSU</label>
                              <p className="text-2xl md:text-6xl font-black text-white leading-[1.1] tracking-tightest">{msg.data.question}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 text-indigo-400 px-6 items-center opacity-30">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-100"></span>
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-200"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeSessionId && (
            <footer className="px-4 py-4 md:px-12 md:py-8 shrink-0 z-40 bg-slate-950/20 backdrop-blur-xl border-t border-white/5">
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-full p-2 transition-all hover:bg-white/10">
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Düşünceni buraya yaz..."
                  className="flex-1 max-h-24 md:max-h-40 py-2.5 px-5 md:px-12 bg-transparent border-none focus:ring-0 text-lg md:text-4xl font-bold text-white placeholder:text-white/10 resize-none no-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  className={`p-4 md:p-10 rounded-xl md:rounded-full transition-all ${
                    input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg active:scale-90' : 'bg-white/5 text-white/5'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
              <p className="text-[8px] md:text-[11px] text-white/10 text-center mt-3 uppercase tracking-[0.4em] font-black">NEXTGENLAB P4C ENGINE – GELECEĞİN DÜŞÜNÜRLERİ</p>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
