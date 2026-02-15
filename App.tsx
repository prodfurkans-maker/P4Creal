
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

      // Non-blocking title generation
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
            id: Date.now().toString(), role: 'assistant', content: "Bağlantı biraz yavaşladı, tekrar deneyebilir misin?", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full bg-[#f8fafc] overflow-hidden text-[#1e293b]" style={{ height: '100dvh' }}>
      {/* Sidebar - Professional Navy Accents */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-64 md:w-72 h-full bg-white border-r border-slate-100 shadow-xl lg:shadow-none">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative premium-light-bg h-full overflow-hidden">
        {/* Header - Transparent Glass */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 bg-white/40 backdrop-blur-xl border-b border-slate-100/50 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border border-slate-100">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-extrabold text-slate-900 text-[10px] md:text-xs uppercase tracking-widest opacity-80">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button onClick={handleNewChat} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white active:scale-95 transition-all rounded-full border border-transparent hover:border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-4">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center py-6 text-center max-w-4xl mx-auto animate-in fade-in duration-700">
              {/* Logo Section - Compact for no-scroll */}
              <div className="glass-card flex items-center gap-6 md:gap-10 px-8 py-6 md:px-12 md:py-8 rounded-[3rem] mb-8 float-animation">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                <div className="h-12 md:h-14 w-[1px] bg-slate-200"></div>
                <img src={SECOND_LOGO_URL} alt="P4C Türkiye Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
              </div>

              <div className="space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-6xl font-[900] text-slate-900 tracking-tight leading-[1.1]">
                  Sor. Düşün.<br/> 
                  <span className="gradient-highlight">Yapay Zeka</span> ile Keşfet.
                </h2>
                <div className="inline-flex items-center gap-3 bg-white border border-slate-100 px-6 py-2 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                  <p className="text-indigo-600 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em]">
                    P4C + Yapay Zeka = Geleceğin Eğitimi
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md mt-10 md:mt-16 px-4">
                <button 
                  onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                  className="w-full py-6 md:py-8 cta-premium rounded-[2.5rem] shadow-sm active:scale-[0.98] group"
                >
                  <p className="text-slate-800 font-bold text-base md:text-xl group-hover:text-indigo-600 transition-colors">
                    "Hadi birlikte keşfe çıkalım."
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 py-8 pb-40">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-400`}>
                  <div className={`max-w-[95%] md:max-w-[80%] px-6 py-5 md:px-10 md:py-8 rounded-[2rem] md:rounded-[2.5rem] ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white font-medium shadow-lg' 
                      : 'ai-bubble text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-base md:text-2xl leading-relaxed tracking-tight font-semibold">{msg.content}</p>
                    ) : (
                      <div className="space-y-8 md:space-y-10">
                        {msg.data ? (
                          <div className="space-y-8 md:space-y-10 text-left">
                            <div>
                              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2 opacity-50">Duygu Tasdiki</label>
                              <p className="text-xl md:text-2xl font-black text-slate-900 leading-tight">"{msg.data.empathy}"</p>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2 opacity-50">Felsefi Işık</label>
                              <p className="text-sm md:text-lg text-slate-500 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-8 md:p-10 bg-indigo-50/50 border border-indigo-100/30 rounded-[2rem]">
                              <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-4">P4C SORUSU</label>
                              <p className="text-2xl md:text-4xl font-[900] text-slate-900 leading-[1.1] tracking-tight">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base md:text-2xl leading-relaxed font-semibold">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 text-indigo-400 px-8 items-center opacity-50">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-300"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Minimal & Accessible */}
        <div className="px-6 py-6 md:py-10 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent z-40 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[2.2rem] md:rounded-[3rem] shadow-lg p-2 md:p-3 pl-6 md:pl-8 input-glow transition-all duration-300">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-32 md:max-h-52 min-h-[44px] py-3 bg-transparent border-none focus:ring-0 text-base md:text-2xl font-semibold text-slate-800 placeholder:text-slate-300 resize-none no-scrollbar"
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
                className={`mb-1 md:mb-1.5 p-3.5 md:p-6 rounded-[1.8rem] transition-all flex items-center justify-center ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white shadow-md active:scale-90 hover:bg-indigo-700' 
                    : 'bg-slate-50 text-slate-200'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 md:h-7 md:w-7" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-7 md:h-7"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
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
