
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
        id: newId, title, messages: [userMsg], createdAt: Date.now()
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
    <div className="flex w-full bg-white overflow-hidden text-slate-900 selection:bg-indigo-100" style={{ height: '100dvh' }}>
      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full shadow-2xl lg:shadow-none bg-slate-950">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative bg-[#fcfdfe] mesh-bg h-full overflow-hidden">
        {/* Navbar */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
              <h1 className="font-black text-slate-900 text-[10px] md:text-base uppercase tracking-tight truncate max-w-[120px] md:max-w-none">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button onClick={handleNewChat} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        {/* Dynamic Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
              {/* Logos Section - Zero Scroll Focus */}
              <div className="logo-container flex items-center gap-8 md:gap-14 p-6 md:p-10 rounded-[3rem] shrink-0 mb-8 md:mb-12">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-16 h-16 md:w-28 md:h-28 object-contain" />
                <div className="h-10 md:h-20 w-px bg-slate-200"></div>
                <img src={SECOND_LOGO_URL} alt="Partner Logo" className="w-16 h-16 md:w-28 md:h-28 object-contain" />
              </div>

              {/* Slogan - Balanced for Zero Scroll */}
              <div className="space-y-4 md:space-y-6 max-w-2xl mt-4 md:mt-8">
                <h2 className="text-3xl md:text-6xl font-[950] text-slate-900 tracking-tightest leading-[1.1]">
                  Sor. Düşün.<br/> 
                  <span className="text-indigo-600">Yapay Zeka ile Keşfet.</span>
                </h2>
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm md:text-2xl font-medium tracking-tight italic opacity-80">
                    "Yapay Zeka Çağında Düşünen Nesiller."
                  </p>
                  <div className="inline-block bg-indigo-50 border border-indigo-100/50 px-6 py-2 rounded-full shadow-sm">
                    <p className="text-indigo-600 text-[8px] md:text-sm font-black uppercase tracking-[0.3em]">
                      P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Button Container */}
              <div className="w-full max-w-md mt-12 md:mt-16">
                <button 
                  onClick={() => handleSend("Senin fikirlerin dünyayı daha güzel bir yer yapabilir! Bugün zihninde neler keşfetmek istersin?")}
                  className="w-full p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:border-indigo-200 transition-all active:scale-[0.97] group"
                >
                  <p className="text-slate-800 font-bold text-sm md:text-xl leading-snug group-hover:text-indigo-600 transition-colors">
                    "Fikirlerin dünyayı değiştirebilir! Hadi birlikte keşfe çıkalım."
                  </p>
                  <div className="mt-4 flex justify-center text-indigo-400 font-black text-[9px] uppercase tracking-widest">KEŞFETMEYE BAŞLA</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-10 px-4 md:px-0 pb-40">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[95%] md:max-w-[85%] px-6 py-5 md:px-10 md:py-8 rounded-[2rem] md:rounded-[3rem] shadow-sm ${
                    msg.role === 'user' ? 'bg-slate-900 text-white font-medium' : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-base md:text-2xl leading-relaxed font-semibold">{msg.content}</p>
                    ) : (
                      <div className="space-y-8 md:space-y-12">
                        {msg.data ? (
                          <div className="space-y-8 md:space-y-12">
                            <div>
                              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2 opacity-50">Duygu Tasdiki</label>
                              <p className="text-lg md:text-3xl font-black text-slate-900 leading-tight">"{msg.data.empathy}"</p>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2 opacity-50">Felsefi Işık</label>
                              <p className="text-sm md:text-xl text-slate-600 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-8 md:p-14 bg-indigo-50/50 rounded-[2.5rem] md:rounded-[4rem] border border-indigo-100/50">
                              <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-4">P4C SORUSU</label>
                              <p className="text-2xl md:text-5xl font-black text-slate-900 leading-[1.05] tracking-tightest">{msg.data.question}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base md:text-2xl leading-relaxed font-medium">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 text-indigo-500 px-6">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Controller - Zero Visual Break */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-white via-white to-transparent z-20 shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl p-2 md:p-4 pl-6 md:pl-10 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-32 md:max-h-52 min-h-[44px] py-4 bg-transparent border-none focus:ring-0 text-base md:text-2xl font-bold text-slate-800 placeholder:text-slate-300 resize-none no-scrollbar"
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
                className={`mb-1.5 md:mb-2 p-4 md:p-7 rounded-[1.8rem] transition-all ${
                  input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg active:scale-90' : 'bg-slate-50 text-slate-200'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 md:h-8 md:w-8" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
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
