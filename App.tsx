
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message, ChatSession } from './types.ts';
import { getP4CResponse, generateTitle } from './services/geminiService.ts';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ng_sessions_p4c_v2');
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
    localStorage.setItem('ng_sessions_p4c_v2', JSON.stringify(sessions));
  }, [sessions]);

  // Akıllı Kaydırma: İlk hikaye parçasında en üste, cevaplarda en alta odaklanır.
  useEffect(() => {
    if (scrollRef.current && activeSession?.messages) {
      const isInitial = activeSession.messages.length <= 2;
      if (isInitial) {
        setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
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
      content: messageText || "Keşfe başlayalım!",
      timestamp: Date.now()
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: "Düşünce Keşfi", messages: [userMsg], createdAt: Date.now() };
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
      {/* Sidebar - Mobil ve Masaüstü */}
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
        <div className="w-full max-w-4xl h-full flex flex-col md:glass-card md:rounded-[2.5rem] overflow-hidden bg-slate-900/40 md:bg-transparent shadow-2xl">
          
          {/* Header - Daha Kompakt Mobil Ölçeklendirme */}
          <header className="flex items-center justify-between px-4 py-3 md:px-10 md:py-8 shrink-0 z-30 border-b border-white/5 backdrop-blur-md">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-center max-w-[80%]">
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-lg md:rounded-xl p-1 w-8 h-8 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[9px] md:text-[14px] text-white/90 uppercase tracking-tight">NEXTGENLAB</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10 shrink-0"></div>
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="bg-white rounded-lg md:rounded-xl p-1 w-8 h-8 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
                  <img src={SECOND_LOGO_URL} alt="P4C" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[9px] md:text-[14px] text-white/90 uppercase tracking-widest">P4C</span>
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              /* Ana Sayfa (Hero Section) - Giriş Kısmı Kaldırıldı */
              <div className="h-full flex flex-col items-center justify-center text-center px-6 md:px-12 animate-in fade-in duration-700">
                <div className="space-y-8 md:space-y-16 hero-float w-full max-w-full pb-10">
                  <h2 className="text-[2.2rem] sm:text-6xl md:text-[6.5rem] font-[1000] text-white tracking-tightest leading-[1.05] drop-shadow-2xl">
                    Düşün, Sor.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="flex flex-col items-center gap-10 md:gap-14 w-full">
                    <div className="bg-white/5 inline-flex items-center gap-3 px-6 md:px-10 py-3 md:py-6 rounded-full border border-white/10 shadow-xl backdrop-blur-sm">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full shadow-[0_0_15px_#38bdf8] animate-pulse"></span>
                      <p className="text-[9px] md:text-xl font-black uppercase tracking-[0.2em] text-sky-100 whitespace-nowrap">
                        P4C + YAPAY ZEKA = GELECEĞİN EĞİTİMİ
                      </p>
                    </div>

                    <button 
                      onClick={() => handleSend("Keşfe başlayalım!")}
                      className="glow-button w-[80%] md:w-auto px-12 md:px-24 py-6 md:py-10 rounded-full text-white font-black text-sm md:text-3xl tracking-tight shadow-2xl transform active:scale-95 transition-all"
                    >
                      Keşfe Başla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Sohbet Alanı - Mobil Ölçeklendirme İyileştirildi */
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-16 py-6 space-y-8 md:space-y-16">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                    <div className={`max-w-[92%] md:max-w-[85%] px-5 py-4 md:px-12 md:py-10 rounded-2xl md:rounded-[3.5rem] ${
                      msg.role === 'user' ? 'chat-bubble-user text-white font-bold' : 'chat-bubble-ai text-white/95'
                    }`}>
                      {msg.role === 'user' ? <p className="text-base md:text-3xl leading-relaxed">{msg.content}</p> : (
                        <div className="space-y-8 md:space-y-14 text-left">
                          {msg.data?.storyContent && (
                            <div className="bg-white/5 p-5 md:p-12 rounded-xl md:rounded-[3rem] border border-white/10">
                              <label className="text-[8px] md:text-[12px] font-black text-sky-400 uppercase tracking-widest block mb-3 opacity-70">HİKAYE</label>
                              <p className="text-base md:text-3xl font-medium leading-relaxed italic text-slate-100">{msg.data.storyContent}</p>
                            </div>
                          )}
                          
                          {msg.data?.reflection && (
                            <div>
                              <label className="text-[8px] md:text-[12px] font-black text-indigo-300 uppercase tracking-widest block mb-2 opacity-80">YANSITMA</label>
                              <p className="text-lg md:text-4xl font-black text-white leading-tight">"{msg.data.reflection}"</p>
                            </div>
                          )}

                          {msg.data?.question && (
                            <div className="p-6 md:p-14 bg-indigo-500/20 border-2 border-indigo-500/30 rounded-2xl md:rounded-[4rem] relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-indigo-500"></div>
                              <label className="text-[9px] md:text-[13px] font-black text-indigo-400 uppercase tracking-widest block mb-4 opacity-90 italic">DÜŞÜNME SORUSU</label>
                              <p className="text-xl md:text-6xl font-black text-white leading-[1.1] tracking-tightest">{msg.data.question}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 text-indigo-400 px-6 items-center opacity-50">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Sadece Sohbet Sırasında ve Kompakt Ölçekte */}
          {activeSessionId && (
            <footer className="px-4 py-4 md:px-16 md:py-10 shrink-0 z-40 bg-slate-950/40 backdrop-blur-2xl border-t border-white/5">
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl md:rounded-full p-2 shadow-inner transition-all hover:bg-white/10 group">
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Düşünceni paylaş..."
                  className="flex-1 max-h-32 py-3 px-4 md:px-12 bg-transparent border-none focus:ring-0 text-lg md:text-4xl font-bold text-white placeholder:text-white/10 resize-none no-scrollbar"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  className={`p-3 md:p-10 rounded-lg md:rounded-full transition-all flex items-center justify-center ${
                    input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg scale-100 hover:bg-indigo-500 active:scale-90' : 'bg-white/5 text-white/5 opacity-20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
              <p className="text-[8px] md:text-[12px] text-white/10 text-center mt-3 uppercase tracking-[0.3em] font-black">NEXTGENLAB AI – GELECEĞİN DÜŞÜNÜRLERİ İÇİN</p>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
