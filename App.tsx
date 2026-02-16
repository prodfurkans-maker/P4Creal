
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

  // Akıllı Kaydırma: Eğer ilk mesaj geliyorsa en yukarı, devam ediyorsa aşağı kaydır.
  useEffect(() => {
    if (scrollRef.current && activeSession?.messages) {
      const isInitialStory = activeSession.messages.length <= 2;
      if (isInitialStory) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
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
        <div className="w-full max-w-4xl h-full flex flex-col md:glass-card md:rounded-[3rem] overflow-hidden bg-slate-900/50 md:bg-transparent shadow-2xl transition-all duration-500">
          
          <header className="flex items-center justify-between px-4 md:px-10 py-6 md:py-12 shrink-0 z-30 border-b border-white/5 backdrop-blur-md">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-3 md:gap-10 flex-1 justify-center max-w-[85%]">
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-xl p-1.5 w-10 h-10 md:w-20 md:h-20 flex items-center justify-center shadow-2xl border-2 border-white/10 transition-transform hover:scale-105">
                  <img src={LOGO_URL} alt="NextGenLAB" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[11px] md:text-[20px] tracking-tight text-white/95 uppercase">NEXTGENLAB</span>
              </div>
              
              <div className="h-10 w-[1px] bg-white/10 shrink-0 mx-1 md:mx-4"></div>
              
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-xl p-1.5 w-10 h-10 md:w-20 md:h-20 flex items-center justify-center shadow-2xl border-2 border-white/10 transition-transform hover:scale-105">
                  <img src={SECOND_LOGO_URL} alt="P4C Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[11px] md:text-[20px] tracking-widest text-white/95 uppercase">P4C</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 md:px-12 animate-in fade-in duration-1000">
                <div className="space-y-12 md:space-y-20 hero-float w-full max-w-full pb-10">
                  <h2 className="text-[2.8rem] sm:text-7xl md:text-[7.5rem] font-[1000] text-white tracking-tightest leading-[1] drop-shadow-2xl">
                    Düşün, Sor.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="flex flex-col items-center gap-12 md:gap-20 w-full">
                    <div className="bg-white/5 inline-flex items-center gap-3 px-8 md:px-16 py-5 md:py-8 rounded-full border border-white/10 shadow-2xl backdrop-blur-sm">
                      <span className="w-3.5 h-3.5 bg-sky-400 rounded-full shadow-[0_0_25px_#38bdf8] animate-pulse"></span>
                      <p className="text-[10px] md:text-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-sky-100 whitespace-nowrap">
                        P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSend("Hadi hikayeye başlayalım!")}
                      className="glow-button w-[90%] md:w-auto px-16 md:px-32 py-8 md:py-14 rounded-full text-white font-black text-sm md:text-4xl tracking-tight shadow-2xl transform active:scale-95 transition-all"
                    >
                      Keşfe Başla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-20 py-10 space-y-12 md:space-y-20">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                    <div className={`max-w-[95%] md:max-w-[92%] px-6 py-6 md:px-16 md:py-14 rounded-3xl md:rounded-[4.5rem] ${
                      msg.role === 'user' ? 'chat-bubble-user text-white font-bold' : 'chat-bubble-ai text-white/95'
                    }`}>
                      {msg.role === 'user' ? <p className="text-xl md:text-4xl leading-relaxed">{msg.content}</p> : (
                        <div className="space-y-12 md:space-y-20 text-left">
                          {msg.data?.storyContent && (
                            <div className="bg-white/5 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-inner">
                              <label className="text-[10px] md:text-[14px] font-black text-sky-400 uppercase tracking-widest block mb-6 opacity-80">HİKAYE AKIŞI</label>
                              <p className="text-xl md:text-4xl font-medium leading-[1.4] italic text-slate-100">{msg.data.storyContent}</p>
                            </div>
                          )}
                          
                          {msg.data?.reflection && (
                            <div className="animate-in fade-in duration-700 delay-300">
                              <label className="text-[10px] md:text-[14px] font-black text-indigo-300 uppercase tracking-widest block mb-4 opacity-80">YANSITMA</label>
                              <p className="text-2xl md:text-5xl font-black text-white leading-tight">"{msg.data.reflection}"</p>
                            </div>
                          )}

                          {msg.data?.question && (
                            <div className="p-10 md:p-20 bg-indigo-500/20 border-2 border-indigo-500/30 rounded-[3rem] md:rounded-[5rem] relative overflow-hidden shadow-[0_0_70px_rgba(79,70,229,0.3)] animate-in zoom-in-95 duration-700 delay-500">
                              <div className="absolute top-0 left-0 w-3 h-full bg-indigo-500 shadow-[0_0_20px_#4f46e5]"></div>
                              <label className="text-[11px] md:text-[16px] font-black text-indigo-400 uppercase tracking-widest block mb-8 opacity-90 italic">GÜNÜN DÜŞÜNME SORUSU</label>
                              <p className="text-3xl md:text-[5.5rem] font-black text-white leading-[1.05] tracking-tightest drop-shadow-2xl">{msg.data.question}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 text-indigo-400 px-12 items-center opacity-70">
                    <span className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Sadece sohbet aktifken gösterilir */}
          {activeSessionId && (
            <footer className="px-4 py-8 md:px-20 md:py-16 shrink-0 z-40 bg-slate-900/60 backdrop-blur-2xl border-t border-white/5 animate-in slide-in-from-bottom-10 duration-500">
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-full p-3 shadow-2xl transition-all hover:bg-white/10">
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Düşüncelerini buraya yaz..."
                  className="flex-1 max-h-48 py-6 px-8 md:px-16 bg-transparent border-none focus:ring-0 text-2xl md:text-5xl font-bold text-white placeholder:text-white/10 resize-none no-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  className={`p-6 md:p-12 rounded-xl md:rounded-full transition-all flex items-center justify-center ${
                    input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-[0_0_60px_rgba(79,70,229,0.7)] hover:bg-indigo-500 active:scale-90 scale-110 md:scale-100' : 'bg-white/5 text-white/5'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-16 md:h-16"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
              <p className="text-[11px] md:text-[15px] text-white/20 text-center mt-8 uppercase tracking-[0.5em] font-black">NEXTGENLAB P4C ENGINE – GELECEĞİN DÜŞÜNÜRLERİ İÇİN</p>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
