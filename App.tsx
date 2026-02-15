
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message, ChatSession } from './types.ts';
import { getEmpathyResponse, generateTitle } from './services/geminiService.ts';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ng_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const LOGO_URL = "https://lh3.googleusercontent.com/d/1iuS4shzoEIy9xsMHhm7AUyMKmuZ9WCgp";
  const SECOND_LOGO_URL = "https://lh3.googleusercontent.com/d/1IXK9E888uqex4wBK1VYBb6byBHFKRe3E";

  useEffect(() => {
    localStorage.setItem('ng_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
    setIsSidebarOpen(false);
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId, 
        title: "Düşünülüyor...", 
        messages: [userMsg], 
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;

      generateTitle(messageText).then(title => {
        setSessions(prev => prev.map(s => s.id === newId ? { ...s, title } : s));
      });
    } else {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
      ));
    }

    setInput('');
    setIsLoading(true);

    try {
      const data = await getEmpathyResponse(messageText);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        data
      };
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    } catch (err) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { 
          ...s, 
          messages: [...s.messages, {
            id: Date.now().toString(), role: 'assistant', content: "Küçük bir hata oluştu, tekrar dene.", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden">
      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full bg-slate-900 border-r border-white/5 shadow-2xl">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-0 md:p-4 lg:p-6 relative z-10 h-full overflow-hidden">
        <div className="w-full max-w-3xl h-full flex flex-col md:glass-card md:rounded-[2rem] overflow-hidden transition-all duration-500 bg-slate-900/40 md:bg-transparent shadow-2xl">
          
          {/* Header - Balanced Scaling */}
          <header className="flex items-center justify-between px-5 py-3 md:py-6 shrink-0 z-30 border-b border-white/5 backdrop-blur-md">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4 max-w-[70%]">
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <div className="bg-white rounded-md p-0.5 w-6 h-6 md:w-9 md:h-9 flex items-center justify-center shadow-md">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[9px] md:text-[11px] tracking-tight text-white/90 uppercase truncate">NEXTGENLAB</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10 shrink-0 mx-0.5"></div>
              {/* Logolar Boyut Olarak Eşitlendi */}
              <img src={SECOND_LOGO_URL} alt="P4C" className="h-6 md:h-10 object-contain brightness-125 shrink-0" />
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Body - Responsive Scale Fixes */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 md:px-12 animate-in fade-in duration-1000 overflow-hidden">
                <div className="space-y-6 md:space-y-12 hero-float w-full max-w-full">
                  <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-[1000] text-white tracking-tight leading-[1.1] md:leading-[1.05] drop-shadow-2xl px-2">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="flex flex-col items-center gap-6 md:gap-10 w-full">
                    {/* Tek Satır ve Taşmayan Slogan */}
                    <div className="bg-white/5 inline-flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-4 rounded-full border border-white/10 max-w-full overflow-hidden shrink-0">
                      <span className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 bg-sky-400 rounded-full shadow-[0_0_12px_#38bdf8] shrink-0 animate-pulse"></span>
                      <p className="text-[7px] min-[375px]:text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.3em] text-sky-100 whitespace-nowrap">
                        P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="glow-button w-[80%] md:w-auto px-10 md:px-16 py-4 md:py-7 rounded-full text-white font-black text-sm md:text-xl tracking-tight shadow-2xl hover:scale-105 active:scale-95 transform transition-all"
                    >
                      Birlikte Keşfedelim
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-12 py-6 space-y-6 md:space-y-10">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[88%] md:max-w-[80%] px-4 py-3 md:px-10 md:py-8 rounded-2xl md:rounded-[2.5rem] ${
                      msg.role === 'user' 
                        ? 'chat-bubble-user text-white font-bold shadow-lg' 
                        : 'chat-bubble-ai text-white/95 shadow-md backdrop-blur-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm md:text-2xl leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-6">
                          {msg.data ? (
                            <div className="space-y-6 text-left">
                              <div>
                                <label className="text-[8px] md:text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-1 opacity-70">Duygu Tasdiki</label>
                                <p className="text-base md:text-3xl font-black text-white leading-tight">"{msg.data.empathy}"</p>
                              </div>
                              <div>
                                <label className="text-[8px] md:text-[10px] font-black text-sky-300 uppercase tracking-widest block mb-1 opacity-70">Felsefi Işık</label>
                                <p className="text-xs md:text-xl text-slate-300 font-semibold leading-relaxed">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-5 md:p-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl md:rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <label className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 opacity-60">P4C SORUSU</label>
                                <p className="text-lg md:text-4xl font-black text-white leading-tight tracking-tightest">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm md:text-2xl leading-relaxed font-bold">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 text-indigo-400 px-4 items-center opacity-40 scale-75 origin-left">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Compact ChatGPT Style */}
          <footer className="px-4 py-4 md:px-12 md:py-10 shrink-0 z-40 bg-slate-900/20 backdrop-blur-sm border-t border-white/5">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl md:rounded-full p-1.5 shadow-inner transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-32 py-2.5 px-3 md:px-8 bg-transparent border-none focus:ring-0 text-sm md:text-xl font-bold text-white placeholder:text-white/20 resize-none no-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-2.5 md:p-5 rounded-lg md:rounded-full transition-all flex items-center justify-center ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 active:scale-90' 
                    : 'bg-white/5 text-white/5'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-7 md:h-7"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
            <p className="text-[8px] md:text-[10px] text-white/10 text-center mt-3 uppercase tracking-widest font-black">
              NextGenLAB AI – Fikir ve Keşif Ortağın
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
