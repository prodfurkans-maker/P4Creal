
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
    <div className="flex w-full bg-[#0e1116] overflow-hidden text-[#f8fafc]" style={{ height: '100dvh' }}>
      {/* Sidebar - Integrated Dark Design */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full border-r border-white/5 shadow-2xl">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative premium-dark-bg h-full overflow-hidden">
        {/* Header - Minimal Refined Glass */}
        <header className="h-16 md:h-20 flex items-center justify-between px-8 bg-[#0e1116]/80 backdrop-blur-2xl border-b border-white/5 z-30 shrink-0">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-lg flex items-center justify-center p-1 shadow-2xl">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-bold text-white text-[10px] md:text-sm uppercase tracking-widest opacity-90">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button onClick={handleNewChat} className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 active:scale-95 transition-all rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-4">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center max-w-4xl mx-auto animate-in fade-in duration-1000">
              {/* Logo Section - Glassmorphism Refinement */}
              <div className="glass-surface flex items-center gap-10 md:gap-16 px-12 py-10 md:px-16 md:py-12 rounded-[4rem] mb-16 float-animation">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
                <div className="h-16 md:h-20 w-[1px] bg-white/10"></div>
                <img src={SECOND_LOGO_URL} alt="P4C Türkiye Logo" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
              </div>

              <div className="space-y-8 md:space-y-10">
                <h2 className="text-4xl md:text-7xl font-[800] text-white tracking-tightest leading-[1.1] transition-all">
                  Sor. Düşün.<br/> 
                  <span className="gradient-highlight">Yapay Zeka</span> ile Keşfet.
                </h2>
                <div className="inline-flex items-center gap-3.5 bg-white/5 border border-white/5 px-8 py-3.5 rounded-full">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]"></span>
                  <p className="text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em]">
                    P4C + Yapay Zeka = Geleceğin Eğitimi
                  </p>
                </div>
              </div>

              <div className="w-full max-w-lg mt-16 md:mt-24 px-6">
                <button 
                  onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                  className="w-full py-8 md:py-10 cta-premium rounded-[3rem] shadow-2xl active:scale-[0.98] group"
                >
                  <p className="text-white font-bold text-lg md:text-xl tracking-tight group-hover:scale-105 transition-transform">
                    "Hadi birlikte keşfe çıkalım."
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 py-12 pb-48">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-500`}>
                  <div className={`max-w-[95%] md:max-w-[85%] px-8 py-7 md:px-12 md:py-10 rounded-[2.5rem] md:rounded-[3rem] ${
                    msg.role === 'user' 
                      ? 'user-bubble text-slate-100 font-medium' 
                      : 'glass-surface text-slate-200'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-lg md:text-2xl leading-relaxed tracking-tight font-semibold">{msg.content}</p>
                    ) : (
                      <div className="space-y-12 md:space-y-14">
                        {msg.data ? (
                          <div className="space-y-12 md:space-y-16 text-left">
                            <div>
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4 opacity-50">Duygu Tasdiki</label>
                              <p className="text-2xl md:text-3xl font-bold text-white leading-tight">"{msg.data.empathy}"</p>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-4 opacity-50">Felsefi Işık</label>
                              <p className="text-base md:text-xl text-slate-400 font-medium leading-relaxed max-w-3xl">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-10 md:p-14 bg-white/[0.02] border border-white/5 rounded-[3rem] shadow-inner">
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-6">P4C SORUSU</label>
                              <p className="text-3xl md:text-5xl font-[900] text-white leading-[1.1] tracking-tightest">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg md:text-2xl leading-relaxed font-semibold">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5 text-indigo-400 px-10 items-center opacity-60">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Modern Refined Bar */}
        <div className="px-6 py-8 md:py-12 bg-gradient-to-t from-[#0e1116] via-[#0e1116]/95 to-transparent z-40 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end bg-[#161b22] border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl p-3 md:p-4 pl-8 md:pl-10 input-glow transition-all duration-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-32 md:max-h-60 min-h-[48px] py-4 bg-transparent border-none focus:ring-0 text-lg md:text-2xl font-semibold text-white placeholder:text-slate-600 resize-none no-scrollbar"
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
                className={`mb-1.5 md:mb-2.5 p-4 md:p-6 rounded-3xl transition-all flex items-center justify-center ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10 active:scale-90 hover:bg-indigo-500' 
                    : 'bg-white/5 text-white/10 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 md:h-8 md:w-8" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
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
