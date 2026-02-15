
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
            id: Date.now().toString(), role: 'assistant', content: "Teknik bir aksaklık oldu, lütfen tekrar dener misin?", timestamp: Date.now()
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

      <main className="flex-1 flex flex-col items-center p-0 md:p-4 lg:p-6 relative z-10 h-full">
        <div className="w-full max-w-3xl h-full flex flex-col md:glass-card md:rounded-[2.5rem] overflow-hidden transition-all duration-500 bg-slate-900/40 md:bg-transparent">
          
          {/* Header - Balanced Logos */}
          <header className="flex items-center justify-between px-6 py-4 md:py-8 shrink-0 z-30 border-b border-white/5 bg-slate-900/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-none">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg p-1 w-7 h-7 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[10px] md:text-[13px] tracking-tight text-white/90 uppercase">NEXTGENLAB</span>
              </div>
              <div className="h-5 w-[1px] bg-white/10 mx-1"></div>
              {/* Eşitlenmiş P4C Logosu */}
              <img src={SECOND_LOGO_URL} alt="P4C" className="h-7 md:h-10 object-contain brightness-110" />
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Body Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 md:px-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="space-y-12 md:space-y-16 hero-float max-w-lg">
                  <h2 className="text-[3.2rem] md:text-8xl font-[1000] text-white tracking-tightest leading-[1.05] drop-shadow-2xl">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="flex flex-col items-center gap-8">
                    {/* Tek Satır Slogan */}
                    <div className="bg-white/5 inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 whitespace-nowrap overflow-hidden">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full shadow-[0_0_12px_#38bdf8] animate-pulse"></span>
                      <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-sky-100">
                        P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="glow-button px-16 py-6 md:py-8 rounded-full text-white font-black text-lg md:text-2xl tracking-tight shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.5)] transform hover:-translate-y-1"
                    >
                      Birlikte Keşfedelim
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 md:px-14 py-8 space-y-8 md:space-y-12">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                    <div className={`max-w-[92%] md:max-w-[85%] px-6 py-5 md:px-12 md:py-10 rounded-2xl md:rounded-[3rem] ${
                      msg.role === 'user' 
                        ? 'chat-bubble-user text-white font-bold shadow-xl' 
                        : 'chat-bubble-ai text-white/95 shadow-lg backdrop-blur-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-base md:text-2xl leading-relaxed tracking-tight">{msg.content}</p>
                      ) : (
                        <div className="space-y-8 md:space-y-12">
                          {msg.data ? (
                            <div className="space-y-8 md:space-y-12 text-left">
                              <div>
                                <label className="text-[9px] md:text-[11px] font-black text-indigo-300 uppercase tracking-widest block mb-2 opacity-80">Duygu Tasdiki</label>
                                <p className="text-lg md:text-4xl font-black text-white leading-tight tracking-tight">"{msg.data.empathy}"</p>
                              </div>
                              <div>
                                <label className="text-[9px] md:text-[11px] font-black text-sky-300 uppercase tracking-widest block mb-2 opacity-80">Felsefi Işık</label>
                                <p className="text-sm md:text-2xl text-slate-200 font-semibold leading-relaxed">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-6 md:p-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl md:rounded-[3rem] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 shadow-[2px_0_10px_rgba(79,70,229,0.5)]"></div>
                                <label className="text-[9px] md:text-[11px] font-black text-indigo-400 uppercase tracking-widest block mb-3 opacity-70 italic">P4C SORUSU</label>
                                <p className="text-xl md:text-5xl font-black text-white leading-[1.1] tracking-tightest">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base md:text-2xl leading-relaxed font-bold tracking-tight">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-indigo-400 px-8 items-center opacity-60 scale-90 origin-left">
                    <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <footer className="px-5 py-6 md:px-14 md:py-12 shrink-0 z-40 bg-slate-900/30 backdrop-blur-md border-t border-white/5">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-full p-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all duration-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-40 py-4 px-5 md:px-10 bg-transparent border-none focus:ring-0 text-base md:text-2xl font-bold text-white placeholder:text-white/20 resize-none no-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-4 md:p-6 rounded-xl md:rounded-full transition-all flex items-center justify-center shadow-2xl ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-90' 
                    : 'bg-white/5 text-white/5'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </div>
            <p className="text-[9px] md:text-[11px] text-white/10 text-center mt-5 uppercase tracking-[0.3em] font-black">
              NextGenLAB AI – Fikir ve Keşif Ortağın
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
