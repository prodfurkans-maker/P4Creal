
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
    }
  };

  return (
    <div className="flex w-full bg-white overflow-hidden text-slate-900 selection:bg-indigo-100" style={{ height: 'var(--app-height, 100dvh)' }}>
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

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fbfcfd] mesh-bg h-full overflow-hidden">
        <header className="h-14 md:h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/95 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-transform active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
              <h1 className="font-extrabold text-slate-900 tracking-tighter text-[11px] md:text-xl truncate max-w-[150px] md:max-w-xs uppercase leading-none">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button onClick={handleNewChat} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 h-full flex flex-col">
          {!activeSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-between md:justify-center py-8 md:py-14 px-6 max-w-5xl mx-auto w-full animate-in fade-in duration-700 overflow-hidden">
              
              <div className="flex flex-col items-center w-full max-h-full">
                {/* Bigger Logos for Mobile */}
                <div className="logo-container flex items-center gap-10 md:gap-16 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl transform shrink-0 mb-10 md:mb-14">
                  <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                  <div className="h-12 md:h-24 w-px bg-slate-200"></div>
                  <img src={SECOND_LOGO_URL} alt="Partner Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                </div>
                
                {/* Slogan shifted down with mt-12 */}
                <div className="space-y-4 md:space-y-8 text-center w-full shrink-0 mt-8 md:mt-12">
                  <h2 className="text-3xl md:text-7xl font-[950] text-slate-900 tracking-tightest leading-[1.05]">
                    Sor. Düşün.<br/> 
                    <span className="text-indigo-600">Yapay Zeka ile Keşfet.</span>
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-500 text-sm md:text-3xl font-medium tracking-tight opacity-90 max-w-[300px] md:max-w-2xl mx-auto leading-tight italic">
                      "Yapay Zeka Çağında Düşünen Nesiller."
                    </p>
                    <div className="inline-block bg-indigo-50 border border-indigo-100/50 px-6 md:px-12 py-2 md:py-4 rounded-full shadow-sm">
                      <p className="text-indigo-600 text-[9px] md:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap">
                        P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Action Button */}
                <div className="w-full flex justify-center mt-12 md:mt-20 shrink-0 max-w-lg md:max-w-3xl">
                  <button 
                    onClick={() => handleSend("Senin harika fikirlerin dünyayı daha güzel bir yer yapabilir! Bugün zihninde neler keşfetmek istersin?")}
                    className="w-full p-6 md:p-12 text-center bg-white border border-slate-100 rounded-[2.2rem] md:rounded-[4rem] hover:border-indigo-300 hover:shadow-2xl transition-all group active:scale-[0.96] shadow-md"
                  >
                    <span className="block text-indigo-500 font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 md:mb-5">HAYAL GÜCÜ</span>
                    <p className="text-slate-800 font-bold text-sm md:text-3xl leading-snug">
                      "Senin harika fikirlerin dünyayı değiştirebilir! Bugün birlikte neler keşfedelim?"
                    </p>
                  </button>
                </div>
              </div>

              {/* Zero-Scroll Footer */}
              <div className="shrink-0 pt-6 pb-2 opacity-30 mt-auto">
                <p className="text-center text-[9px] md:text-sm text-slate-400 font-black uppercase tracking-[0.4em]">
                  NEXT GEN LAB • 2025
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 py-10 px-4 md:px-0 pb-48">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[95%] md:max-w-[85%] px-6 py-5 md:px-12 md:py-10 rounded-[2rem] md:rounded-[3rem] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white font-medium shadow-lg' 
                    : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-lg md:text-3xl leading-relaxed tracking-tight font-semibold">{msg.content}</p>
                    ) : (
                      <div className="space-y-10 md:space-y-16">
                        {msg.data ? (
                          <div className="space-y-10 md:space-y-16">
                            <div>
                              <label className="text-[9px] md:text-xs font-black text-indigo-500 uppercase tracking-widest block mb-2 md:mb-5 opacity-50">Duygu Tasdiki</label>
                              <p className="text-xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">"{msg.data.empathy}"</p>
                            </div>
                            <div>
                              <label className="text-[9px] md:text-xs font-black text-emerald-500 uppercase tracking-widest block mb-2 md:mb-5 opacity-50">Felsefi Perspektif</label>
                              <p className="text-base md:text-2xl text-slate-600 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-8 md:p-16 bg-indigo-50/50 rounded-[2.5rem] md:rounded-[4rem] border border-indigo-100/50 shadow-inner">
                              <label className="text-[9px] md:text-xs font-black text-indigo-600 uppercase tracking-widest block mb-4 md:mb-8">P4C SORUSU</label>
                              <p className="text-3xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tightest">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg md:text-3xl leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 text-indigo-500 px-8">
                  <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></span>
                  <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-100"></span>
                  <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-200"></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 md:p-12 bg-gradient-to-t from-white via-white to-transparent z-20 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[28px] md:rounded-[48px] shadow-2xl focus-within:ring-4 focus-within:ring-indigo-50 focus-within:border-indigo-300 transition-all p-2.5 md:p-5 pl-7 md:pl-14">
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
                placeholder="Neler düşünüyorsun?"
                className="flex-1 max-h-24 md:max-h-52 min-h-[48px] py-4 md:py-6 bg-transparent border-none focus:ring-0 text-lg md:text-3xl font-bold text-slate-800 placeholder:text-slate-300 resize-none leading-tight"
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
                className={`mb-1.5 md:mb-2 p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] transition-all duration-300 ${
                  input.trim() && !isLoading 
                  ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 active:scale-90' 
                  : 'bg-slate-50 text-slate-200 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 md:h-10 md:w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
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
