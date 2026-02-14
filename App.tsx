
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      const newId = Date.now().toString();
      setIsLoading(true);
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
      // Klavye odaklanması için kısa bir gecikme (mobil için)
      setTimeout(() => inputRef.current?.focus(), 100);
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

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fdfdfd] mesh-bg h-full overflow-hidden">
        {/* Professional Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
              <h1 className="font-bold text-slate-800 tracking-tight text-sm md:text-lg truncate max-w-[140px] md:max-w-xs">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button 
            onClick={handleNewChat}
            className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-indigo-600 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        {/* Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth h-full px-4 md:px-0">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-4 md:py-12 space-y-8 md:space-y-12 animate-in fade-in duration-1000">
              
              {/* Dual Logos - Büyütüldü & Merkeze Odaklandı */}
              <div className="logo-container inline-flex items-center gap-8 md:gap-14 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-xl transform transition-transform duration-700 hover:scale-[1.02]">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                <div className="h-14 md:h-20 w-px bg-slate-200"></div>
                <img src={SECOND_LOGO_URL} alt="Partner Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
              </div>
              
              {/* Slogans */}
              <div className="space-y-4 md:space-y-8">
                <h2 className="text-3xl md:text-7xl font-[900] text-slate-900 tracking-tighter leading-tight md:leading-[1.05]">
                  Düşüncelerini<br/> 
                  <span className="text-indigo-600">Özgürce Keşfet.</span>
                </h2>
                <div className="space-y-4 md:space-y-6">
                  <p className="text-slate-500 text-lg md:text-2xl font-medium tracking-tight px-6 opacity-90 max-w-lg mx-auto">
                    "Yapay Zeka Çağında Düşünen Nesiller."
                  </p>
                  <div className="flex items-center justify-center">
                    <p className="text-blue-600 text-[10px] md:text-sm font-black uppercase tracking-[0.25em] bg-blue-50 border border-blue-100/50 px-5 md:px-8 py-2 rounded-full shadow-sm">
                      P4C + Yapay Zeka = Geleceğin Eğitimi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full pt-4 max-w-lg md:max-w-3xl">
                <button 
                  onClick={() => handleSend("Bugün hayal gücümün sınırlarını nasıl zorlayabilirim?")}
                  className="p-5 md:p-8 text-left bg-white border border-slate-100 rounded-3xl hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group active:scale-[0.97]"
                >
                  <span className="block text-indigo-500 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2 md:mb-4">Yaratıcılık</span>
                  <p className="text-slate-800 font-bold text-sm md:text-lg leading-snug">"Hayal kurmak sence zihnimizin bir süper gücü müdür?"</p>
                </button>
                <button 
                  onClick={() => handleSend("Doğru ve yanlış arasındaki çizgiyi nasıl belirleriz?")}
                  className="p-5 md:p-8 text-left bg-white border border-slate-100 rounded-3xl hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group active:scale-[0.97]"
                >
                  <span className="block text-emerald-500 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2 md:mb-4">Etik</span>
                  <p className="text-slate-800 font-bold text-sm md:text-lg leading-snug">"İyi bir insan olmayı sağlayan şey sadece yaptıklarımız mıdır?"</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 md:gap-10 py-8 md:py-12 pb-40">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-3 duration-400`}>
                  <div className={`max-w-[90%] md:max-w-[85%] px-6 py-4 md:px-8 md:py-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white font-medium shadow-lg shadow-slate-200' 
                    : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-[15px] md:text-lg leading-relaxed tracking-tight">{msg.content}</p>
                    ) : (
                      <div className="space-y-8 md:space-y-12">
                        {msg.data ? (
                          <div className="space-y-8 md:space-y-12">
                            <div className="animate-in fade-in duration-500">
                              <label className="text-[10px] md:text-xs font-black text-indigo-500 uppercase tracking-widest block mb-2 md:mb-3 opacity-50">Empati Duyumu</label>
                              <p className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">"{msg.data.empathy}"</p>
                            </div>
                            <div className="animate-in fade-in duration-500 delay-100">
                              <label className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-widest block mb-2 md:mb-3 opacity-50">Felsefi Perspektif</label>
                              <p className="text-[15px] md:text-lg text-slate-600 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-6 md:p-10 bg-indigo-50/40 rounded-[2rem] md:rounded-[3rem] border border-indigo-100/50 shadow-inner animate-in zoom-in-95 duration-500 delay-200">
                              <label className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest block mb-3 md:mb-4">P4C SORUSU</label>
                              <p className="text-xl md:text-3xl font-black text-slate-900 leading-[1.15] tracking-tight">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[15px] md:text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 text-indigo-400 px-6">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pro Input Interface */}
        <div className="p-4 md:p-12 bg-gradient-to-t from-white via-white to-white/0 relative z-20 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] shadow-lg focus-within:shadow-2xl focus-within:border-indigo-400 focus-within:ring-8 focus-within:ring-indigo-50 transition-all duration-500 p-2.5 md:p-3 pl-5 md:pl-8">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { 
                  if(e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                placeholder="Düşüncelerini buraya fısılda..."
                className="flex-1 max-h-32 md:max-h-56 min-h-[44px] py-3 md:py-4 bg-transparent border-none focus:ring-0 text-base md:text-xl font-semibold text-slate-800 placeholder:text-slate-300 resize-none leading-normal"
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
                className={`mb-1.5 md:mb-2 p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all duration-300 ${
                  input.trim() && !isLoading 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-90' 
                  : 'bg-slate-50 text-slate-200'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 md:h-6 md:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                )}
              </button>
            </div>
            
            {/* Professional Footer Bar */}
            <div className="mt-4 md:mt-6 flex flex-col items-center gap-2 opacity-50">
               <p className="text-center text-[9px] md:text-[13px] text-slate-400 font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">
                Empati • Felsefe • Yapay Zeka
              </p>
              <div className="h-1 w-12 md:w-20 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
