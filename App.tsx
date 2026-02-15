
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
            id: Date.now().toString(), role: 'assistant', content: "Küçük bir teknik aksaklık oldu, lütfen tekrar dene.", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden text-white">
      {/* Sidebar - Enhanced Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full deep-glass border-r border-white/5">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-2 md:p-10 relative z-10 h-full">
        {/* Main Interface Container - Styled after image */}
        <div className="w-full max-w-2xl h-full flex flex-col glass-card rounded-[3rem] md:rounded-[4rem] relative overflow-hidden transition-all duration-700">
          
          {/* Header - P4C LOGO BÜYÜTÜLDÜ (h-10 -> h-16) */}
          <header className="flex items-center justify-between px-6 md:px-12 py-6 md:py-10 shrink-0 z-30 border-b border-white/5 bg-black/20">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/50 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-xl p-1.5 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center shadow-xl">
                  <img src={LOGO_URL} alt="NGL" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[10px] md:text-[13px] tracking-tighter text-white uppercase opacity-90">NEXTGENLAB</span>
              </div>
              <div className="h-6 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-3">
                {/* BÜYÜTÜLMÜŞ P4C LOGOSU */}
                <img src={SECOND_LOGO_URL} alt="P4C" className="h-10 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-white/40 uppercase leading-none">TÜRKİYE</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/50 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Body Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-10 md:px-20 animate-in fade-in zoom-in-95 duration-1000">
                <div className="space-y-12 aura-anim">
                  <h2 className="text-4xl md:text-7xl font-[1000] text-white tracking-tightest leading-[1.05]">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  {/* MOBİL GÖRÜNÜRLÜK: deep-glass tabanlı fütüristik pill */}
                  <div className="deep-glass inline-flex items-center gap-4 px-8 py-3.5 rounded-full border border-white/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]"></span>
                    <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-white text-shadow-lg">
                      P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                    </p>
                  </div>

                  <div className="pt-10">
                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="neon-btn px-14 py-6 rounded-full text-white font-black text-sm md:text-xl tracking-tight shadow-2xl"
                    >
                      Hadi birlikte keşfe çıkalım.
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-14 py-10 space-y-14">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                    <div className={`max-w-[95%] md:max-w-[85%] px-8 py-7 md:px-14 md:py-12 rounded-[2.5rem] md:rounded-[4rem] ${
                      msg.role === 'user' 
                        ? 'user-bubble text-white font-black shadow-2xl' 
                        : 'deep-glass text-white shadow-2xl'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-xl md:text-4xl leading-tight tracking-tightest">{msg.content}</p>
                      ) : (
                        <div className="space-y-12">
                          {msg.data ? (
                            <div className="space-y-12 text-left">
                              <div className="animate-in fade-in slide-in-from-left-6 duration-500">
                                <label className="text-[11px] font-black text-indigo-300 uppercase tracking-widest block mb-4 italic opacity-80">Duygu Tasdiki</label>
                                <p className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tightest">"{msg.data.empathy}"</p>
                              </div>
                              <div className="animate-in fade-in slide-in-from-left-6 duration-700 delay-200">
                                <label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block mb-4 italic opacity-80">Felsefi Işık</label>
                                <p className="text-base md:text-3xl text-white/70 font-bold leading-relaxed tracking-tight">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-10 md:p-16 bg-white/[0.03] border border-white/10 rounded-[3rem] md:rounded-[4rem] shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,1)]"></div>
                                <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest block mb-6 italic opacity-90">P4C SORUSU</label>
                                <p className="text-3xl md:text-6xl font-[1000] text-white leading-[1.05] tracking-tightest">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xl md:text-4xl leading-relaxed font-black tracking-tightest">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-indigo-400 px-12 items-center opacity-80">
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce delay-150 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce delay-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <footer className="px-6 md:px-16 py-8 md:py-14 shrink-0 z-40 bg-black/40 border-t border-white/5">
            <div className="relative flex items-center deep-glass rounded-full p-2 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini paylaş..."
                className="flex-1 max-h-16 py-4 px-8 md:px-12 bg-transparent border-none focus:ring-0 text-base md:text-2xl font-black text-white placeholder:text-white/20 resize-none no-scrollbar"
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
                className={`p-4 md:p-7 rounded-full transition-all flex items-center justify-center shadow-2xl ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600/50 text-white hover:bg-indigo-600 scale-100' 
                    : 'bg-white/5 text-white/5 scale-90 opacity-50'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 md:h-8 md:w-8 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
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
