
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message, ChatSession } from './types.ts';
import { getP4CResponse, generateTitle } from './services/geminiService.ts';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ng_sessions_p4c');
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
    localStorage.setItem('ng_sessions_p4c', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
    setIsSidebarOpen(false);
  };

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() && !customInput) return;
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || "Hadi başlayalım!",
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: "Düşünce Yolculuğu", messages: [userMsg], createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;
    } else {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    }

    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = activeSession ? activeSession.messages : [];
      const data = await getP4CResponse(messageText, chatHistory);
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: '', 
        timestamp: Date.now(), 
        data 
      };

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
      
      if (chatHistory.length === 0) {
        generateTitle(data.question).then(title => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden">
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full bg-slate-900 border-r border-white/5 shadow-2xl">
          <Sidebar 
            sessions={sessions} activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-0 md:p-4 lg:p-6 relative z-10 h-full overflow-hidden">
        <div className="w-full max-w-3xl h-full flex flex-col md:glass-card md:rounded-[2.5rem] overflow-hidden bg-slate-900/50 md:bg-transparent shadow-2xl">
          
          <header className="flex items-center justify-between px-3 md:px-8 py-5 md:py-10 shrink-0 z-30 border-b border-white/5 backdrop-blur-md">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-2 md:gap-8 flex-1 justify-center max-w-[85%]">
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-xl p-1 w-9 h-9 md:w-16 md:h-16 flex items-center justify-center shadow-2xl border-2 border-white/10">
                  <img src={LOGO_URL} alt="NextGenLAB" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[10px] md:text-[16px] tracking-tighter text-white/95 uppercase">NEXTGENLAB</span>
              </div>
              
              <div className="h-8 w-[1px] bg-white/20 shrink-0"></div>
              
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-xl p-1 w-9 h-9 md:w-16 md:h-16 flex items-center justify-center shadow-2xl border-2 border-white/10">
                  <img src={SECOND_LOGO_URL} alt="P4C Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[10px] md:text-[16px] tracking-[0.2em] text-white/95 uppercase">P4C</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 md:px-12 animate-in fade-in duration-700">
                <div className="space-y-10 md:space-y-16 hero-float w-full max-w-full">
                  <h2 className="text-[2.6rem] sm:text-7xl md:text-9xl font-[1000] text-white tracking-tightest leading-[1] drop-shadow-2xl">
                    Altın<br/> 
                    <span className="gradient-text">Elmalar</span><br/> 
                    Yolculuğu
                  </h2>
                  
                  <div className="flex flex-col items-center gap-10 md:gap-14 w-full">
                    <div className="bg-white/5 inline-flex items-center gap-3 px-6 md:px-12 py-4 md:py-6 rounded-full border border-white/10 shadow-2xl">
                      <span className="w-3 h-3 bg-sky-400 rounded-full shadow-[0_0_20px_#38bdf8] animate-pulse"></span>
                      <p className="text-[10px] md:text-lg font-black uppercase tracking-[0.3em] text-sky-100 whitespace-nowrap">
                        BİR P4C DENEYİMİ BAŞLIYOR
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSend("Hadi hikayeye başlayalım!")}
                      className="glow-button w-[85%] md:w-auto px-14 md:px-28 py-6 md:py-10 rounded-full text-white font-black text-sm md:text-3xl tracking-tight shadow-2xl transform active:scale-95 transition-all"
                    >
                      Keşfe Başla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-16 py-8 space-y-10 md:space-y-16">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-5 duration-300`}>
                    <div className={`max-w-[95%] md:max-w-[90%] px-6 py-5 md:px-14 md:py-12 rounded-3xl md:rounded-[4rem] ${
                      msg.role === 'user' ? 'chat-bubble-user text-white font-bold' : 'chat-bubble-ai text-white/95'
                    }`}>
                      {msg.role === 'user' ? <p className="text-lg md:text-3xl leading-relaxed">{msg.content}</p> : (
                        <div className="space-y-10 md:space-y-16 text-left">
                          {msg.data?.storyContent && (
                            <div className="bg-white/5 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10">
                              <label className="text-[9px] md:text-[13px] font-black text-sky-400 uppercase tracking-widest block mb-4 opacity-70">HİKAYE</label>
                              <p className="text-lg md:text-3xl font-medium leading-relaxed italic text-slate-100">{msg.data.storyContent}</p>
                            </div>
                          )}
                          
                          {msg.data?.reflection && (
                            <div>
                              <label className="text-[9px] md:text-[13px] font-black text-indigo-300 uppercase tracking-widest block mb-3 opacity-80">YANSITMA</label>
                              <p className="text-xl md:text-4xl font-black text-white leading-tight">"{msg.data.reflection}"</p>
                            </div>
                          )}

                          {msg.data?.question && (
                            <div className="p-8 md:p-16 bg-indigo-500/20 border-2 border-indigo-500/30 rounded-[2.5rem] md:rounded-[4.5rem] relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                              <div className="absolute top-0 left-0 w-3 h-full bg-indigo-500"></div>
                              <label className="text-[10px] md:text-[14px] font-black text-indigo-400 uppercase tracking-widest block mb-6 opacity-90 italic">DÜŞÜNME SORUSU</label>
                              <p className="text-2xl md:text-7xl font-black text-white leading-[1] tracking-tightest drop-shadow-lg">{msg.data.question}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-indigo-400 px-10 items-center opacity-60">
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="px-4 py-6 md:px-16 md:py-14 shrink-0 z-40 bg-slate-900/60 backdrop-blur-xl border-t border-white/5">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-full p-2.5 shadow-2xl transition-all">
              <textarea
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Bu konuda ne düşünüyorsun?.."
                className="flex-1 max-h-44 py-5 px-6 md:px-14 bg-transparent border-none focus:ring-0 text-xl md:text-4xl font-bold text-white placeholder:text-white/10 resize-none no-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 180)}px`;
                }}
              />
              <button
                onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                className={`p-5 md:p-10 rounded-xl md:rounded-full transition-all flex items-center justify-center ${
                  input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.6)] hover:bg-indigo-500 active:scale-90' : 'bg-white/5 text-white/5'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-12 md:h-12"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
            <p className="text-[10px] md:text-[14px] text-white/10 text-center mt-6 uppercase tracking-[0.4em] font-black">NEXTGENLAB P4C ENGINE – ADALET VE DÜRÜSTLÜK MODÜLÜ</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
