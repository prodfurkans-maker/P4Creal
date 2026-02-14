
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const LOGO_URL = "https://lh3.googleusercontent.com/d/1iuS4shzoEIy9xsMHhm7AUyMKmuZ9WCgp";
  const SECOND_LOGO_URL = "https://lh3.googleusercontent.com/d/1IXK9E888uqex4wBK1VYBb6byBHFKRe3E";

  useEffect(() => {
    localStorage.setItem('ng_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
    setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() || isLoading) return;

    // Mobil klavye kapatma ve odak kaybını önleme
    if (window.innerWidth < 768) {
      inputRef.current?.blur();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      const newId = Date.now().toString();
      setIsLoading(true); // Başlık üretilirken loading başlat
      const title = await generateTitle(messageText);
      const newSession: ChatSession = {
        id: newId,
        title: title,
        messages: [userMsg],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;
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
      console.error("Chat Error:", err);
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { 
          ...s, 
          messages: [...s.messages, {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Bağlantıda bir sorun oluştu. Lütfen tekrar dener misin?",
            timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden text-slate-900 font-sans selection:bg-indigo-100">
      {/* Sidebar Wrapper */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full shadow-2xl lg:shadow-none">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={deleteSession}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fbfbfb] mesh-bg h-full overflow-hidden">
        {/* Header Section */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
              <h1 className="font-bold text-slate-800 tracking-tight text-sm md:text-base truncate max-w-[140px] md:max-w-xs">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button 
            onClick={handleNewChat}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-indigo-600 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        {/* Dynamic Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth h-full">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-6 py-2 md:py-12 space-y-4 md:space-y-10 animate-in fade-in duration-700">
              
              {/* Dual Logos - Optimized for mobile fit */}
              <div className="logo-container inline-flex items-center gap-6 md:gap-10 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm transform scale-90 md:scale-110">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-14 h-14 md:w-24 md:h-24 object-contain" />
                <div className="h-10 md:h-12 w-px bg-slate-200"></div>
                <img src={SECOND_LOGO_URL} alt="Partner Logo" className="w-14 h-14 md:w-24 md:h-24 object-contain" />
              </div>
              
              {/* Slogans */}
              <div className="space-y-3 md:space-y-6">
                <h2 className="text-2xl md:text-6xl font-[900] text-slate-900 tracking-tighter leading-tight md:leading-[1.1]">
                  Düşüncelerini<br/> 
                  <span className="text-indigo-600">Özgürce Keşfet.</span>
                </h2>
                <div className="space-y-2 md:space-y-5">
                  <p className="text-slate-500 text-sm md:text-xl font-medium tracking-tight px-4 opacity-80">
                    "Yapay Zeka Çağında Düşünen Nesiller."
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-blue-600 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] bg-blue-50/80 border border-blue-100/50 px-3 md:px-5 py-1.5 rounded-full shadow-sm">
                      P4C + Yapay Zeka = Geleceğin Eğitimi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full pt-2 md:pt-4 max-w-lg md:max-w-none">
                <button 
                  onClick={() => handleSend("Bugün hayal gücümün sınırlarını nasıl zorlayabilirim?")}
                  className="p-4 md:p-6 text-left bg-white border border-slate-100 rounded-2xl md:rounded-3xl hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group active:scale-[0.98]"
                >
                  <span className="block text-indigo-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-3">Yaratıcılık</span>
                  <p className="text-slate-800 font-bold text-xs md:text-sm leading-snug">"Hayal kurmak sence zihnimizin bir süper gücü müdür?"</p>
                </button>
                <button 
                  onClick={() => handleSend("Doğru ve yanlış arasındaki çizgiyi nasıl belirleriz?")}
                  className="p-4 md:p-6 text-left bg-white border border-slate-100 rounded-2xl md:rounded-3xl hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group active:scale-[0.98]"
                >
                  <span className="block text-emerald-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-3">Etik</span>
                  <p className="text-slate-800 font-bold text-xs md:text-sm leading-snug">"İyi bir insan olmayı sağlayan şey sadece yaptıklarımız mıdır?"</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 md:gap-8 py-6 md:py-10 px-4 md:px-0 pb-32">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-400`}>
                  <div className={`max-w-[88%] md:max-w-[80%] px-5 py-3.5 md:px-6 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white font-medium shadow-md shadow-slate-100' 
                    : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm md:text-base leading-relaxed tracking-tight">{msg.content}</p>
                    ) : (
                      <div className="space-y-6 md:space-y-8">
                        {msg.data ? (
                          <div className="space-y-6 md:space-y-8 py-1 md:py-2">
                            <div className="animate-in fade-in duration-500">
                              <label className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1.5 md:mb-2 opacity-50">Empati Duyumu</label>
                              <p className="text-base md:text-xl font-bold text-slate-900 tracking-tight leading-snug">"{msg.data.empathy}"</p>
                            </div>
                            <div className="animate-in fade-in duration-500 delay-100">
                              <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1.5 md:mb-2 opacity-50">Felsefi Perspektif</label>
                              <p className="text-xs md:text-base text-slate-600 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-5 md:p-8 bg-[#f8faff] rounded-[1.5rem] md:rounded-[2rem] border border-indigo-50 shadow-inner animate-in zoom-in-95 duration-400 delay-200">
                              <label className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2 md:mb-3">P4C SORUSU</label>
                              <p className="text-lg md:text-2xl font-black text-slate-900 leading-tight tracking-tight">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2.5 text-slate-300 px-4">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-150"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Improved Input Area */}
        <div className="p-3 md:p-10 bg-gradient-to-t from-white via-white/95 to-transparent relative z-20 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[20px] md:rounded-[28px] shadow-sm focus-within:shadow-xl focus-within:border-indigo-300 transition-all duration-300 p-2 md:p-2.5 pl-4 md:pl-6 ring-4 ring-slate-100/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { 
                  if(e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                placeholder="Düşüncelerini buraya fısılda..."
                className="flex-1 max-h-32 md:max-h-48 min-h-[40px] md:min-h-[44px] py-2.5 md:py-3.5 bg-transparent border-none focus:ring-0 text-sm md:text-base font-semibold text-slate-800 placeholder:text-slate-300 resize-none leading-relaxed"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`mb-1.5 md:mb-1 p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 ${
                  input.trim() && !isLoading 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-90' 
                  : 'bg-slate-50 text-slate-200'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </div>
            
            {/* Minimal Footer */}
            <div className="mt-3 md:mt-4 flex flex-col items-center gap-1.5 opacity-60">
               <p className="text-center text-[7px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Empati • Felsefe • Yapay Zeka
              </p>
              <div className="h-0.5 w-6 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
