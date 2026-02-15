
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
            id: Date.now().toString(), role: 'assistant', content: "Bağlantıda bir sorun oldu, tekrar dener misin?", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden text-white">
      {/* Sidebar - Modern Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full glass-card border-r border-white/10">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-4 md:p-10 relative z-10 h-full">
        {/* Main Interface Container - Styled after the provided image */}
        <div className="w-full max-w-2xl h-full flex flex-col glass-card rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden transition-all duration-700">
          
          {/* Header - Fixed & Clear */}
          <header className="flex items-center justify-between px-6 md:px-12 py-6 md:py-8 shrink-0 z-30 border-b border-white/5">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/50 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-3 md:gap-5">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg p-1 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center shadow-lg">
                  <img src={LOGO_URL} alt="NGL Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-extrabold text-[10px] md:text-xs tracking-tighter text-white opacity-80">NEXTGENLAB</span>
              </div>
              <div className="h-4 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-2">
                <img src={SECOND_LOGO_URL} alt="P4C Logo" className="h-5 md:h-7 object-contain" />
                <span className="text-[7px] md:text-[9px] font-black tracking-widest text-white/40">TÜRKİYE</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/50 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Chat Content Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 md:px-16 animate-in fade-in duration-1000">
                <div className="glow-divider opacity-30"></div>
                
                <div className="space-y-6 md:space-y-8 float-animation py-4">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tightest leading-tight">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="glass-pill inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 shadow-lg">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]"></span>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/70">
                      P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                    </p>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="main-cta px-12 py-5 rounded-full text-white font-black text-sm md:text-lg tracking-tight"
                    >
                      Hadi birlikte keşfe çıkalım.
                    </button>
                  </div>
                </div>

                <div className="glow-divider opacity-30 mt-8"></div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-12 py-8 space-y-10">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`max-w-[95%] md:max-w-[85%] px-7 py-6 md:px-10 md:py-8 rounded-[2rem] md:rounded-[3rem] ${
                      msg.role === 'user' 
                        ? 'bg-white/10 border border-white/10 text-white shadow-xl' 
                        : 'glass-pill text-white/90 border-white/20'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-base md:text-2xl leading-relaxed tracking-tight font-bold">{msg.content}</p>
                      ) : (
                        <div className="space-y-8">
                          {msg.data ? (
                            <div className="space-y-8 text-left">
                              <div>
                                <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-3 opacity-60">Duygu Tasdiki</label>
                                <p className="text-lg md:text-2xl font-black text-white leading-tight">"{msg.data.empathy}"</p>
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-3 opacity-60">Felsefi Işık</label>
                                <p className="text-sm md:text-lg text-white/60 font-semibold leading-relaxed">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-7 bg-white/5 border border-white/5 rounded-[2rem] shadow-inner">
                                <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-4 opacity-60">P4C SORUSU</label>
                                <p className="text-xl md:text-3xl font-black text-white leading-snug tracking-tight">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base md:text-2xl leading-relaxed font-bold">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 text-indigo-400 px-8 items-center opacity-70">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Area - Pill shaped as per image */}
          <footer className="px-6 md:px-14 py-8 md:py-10 shrink-0 z-40 bg-gradient-to-t from-black/20 to-transparent">
            <div className="relative flex items-center glass-pill rounded-full p-2 border border-white/20 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-16 py-3 px-6 md:px-8 bg-transparent border-none focus:ring-0 text-sm md:text-lg font-bold text-white placeholder:text-white/30 resize-none no-scrollbar"
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
                className={`p-3.5 md:p-5 rounded-full transition-all flex items-center justify-center shadow-lg ${
                  input.trim() && !isLoading 
                    ? 'bg-white/10 text-indigo-300 hover:text-white hover:bg-white/20' 
                    : 'bg-white/5 text-white/5'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
