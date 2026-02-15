
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
            id: Date.now().toString(), role: 'assistant', content: "Hızlı bir bağlantı sorunu oldu. Lütfen tekrar dener misin?", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg overflow-hidden text-white" style={{ height: '100dvh' }}>
      {/* Sidebar - Integrated Glass */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full glass-container border-r border-white/5 shadow-2xl">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 h-full overflow-hidden">
        {/* Main Glass Card */}
        <div className="w-full max-w-2xl h-full max-h-[850px] glass-container rounded-[2.5rem] md:rounded-[4rem] flex flex-col relative overflow-hidden transition-all duration-700">
          
          {/* Header Area inside the Card */}
          <header className="flex items-center justify-between px-8 md:px-12 py-8 shrink-0 z-20">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-all active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-1.5 w-8 h-8 md:w-11 md:h-11 flex items-center justify-center shadow-lg border border-white/10">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black tracking-tighter text-[10px] md:text-[12px] text-white/80 uppercase">NEXTGENLAB</span>
              </div>
              <div className="h-5 w-[1px] bg-white/10 mx-1"></div>
              <div className="flex flex-col items-center gap-0.5">
                <img src={SECOND_LOGO_URL} alt="P4C Türkiye" className="h-6 md:h-9 object-contain opacity-90" />
                <span className="text-[6px] md:text-[7px] font-black tracking-[0.3em] text-white/30 uppercase">TÜRKİYE</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-all active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Content Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 md:px-16 animate-in fade-in zoom-in-95 duration-1000">
                
                {/* Decorative Elements Above Text */}
                <div className="space-y-4 mb-4 opacity-40">
                  <div className="decorative-line"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mx-auto blur-[1px]"></div>
                </div>

                <div className="space-y-6 md:space-y-8 float-animation">
                  <h2 className="text-4xl md:text-6xl font-[900] text-white tracking-tightest leading-[1.05]">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="glass-pill inline-flex items-center gap-3 px-8 py-2.5 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]"></span>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/50">
                      P4C + Yapay Zeka = Geleceğin Eğitimi
                    </p>
                  </div>

                  <div className="pt-6 relative">
                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="glow-button px-12 py-5 rounded-full text-white font-black text-sm md:text-lg tracking-tight active:scale-95"
                    >
                      Hadi birlikte keşfe çıkalım.
                    </button>
                    
                    {/* Decorative Elements Below Button */}
                    <div className="mt-10 space-y-4 opacity-40">
                      <div className="w-1 h-1 bg-purple-500 rounded-full mx-auto"></div>
                      <div className="decorative-line"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-12 py-8 space-y-12">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                    <div className={`max-w-[95%] md:max-w-[85%] px-8 py-7 md:px-12 md:py-10 rounded-[2.5rem] md:rounded-[3.5rem] ${
                      msg.role === 'user' 
                        ? 'bg-white/5 border border-white/10 text-white shadow-2xl backdrop-blur-sm' 
                        : 'glass-pill text-white/90 shadow-xl'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-lg md:text-3xl leading-snug tracking-tight font-[800]">{msg.content}</p>
                      ) : (
                        <div className="space-y-12">
                          {msg.data ? (
                            <div className="space-y-12 text-left">
                              <div>
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4 opacity-40 italic">Duygu Tasdiki</label>
                                <p className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight">"{msg.data.empathy}"</p>
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-4 opacity-40 italic">Felsefi Işık</label>
                                <p className="text-base md:text-xl text-white/60 font-semibold leading-relaxed max-w-lg">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[3rem] shadow-inner">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-6 italic opacity-50">P4C SORUSU</label>
                                <p className="text-3xl md:text-5xl font-[1000] text-white leading-[1.05] tracking-tightest">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-lg md:text-3xl leading-relaxed font-black tracking-tight">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-indigo-400 px-12 items-center">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Input Area - The "Düşüncelerini Paylaş" pill from image */}
          <div className="px-8 md:px-14 py-10 shrink-0 relative z-20">
            <div className="relative flex items-center glass-pill rounded-full p-2.5 pl-8 md:pl-12 border border-white/10 shadow-2xl transition-all duration-500 focus-within:ring-2 focus-within:ring-indigo-500/30">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-16 py-4 bg-transparent border-none focus:ring-0 text-base md:text-xl font-bold text-white placeholder:text-white/20 resize-none no-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-4 md:p-5 rounded-full transition-all flex items-center justify-center ${
                  input.trim() && !isLoading 
                    ? 'text-indigo-400 hover:text-white hover:bg-white/5 active:scale-90' 
                    : 'text-white/5'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
