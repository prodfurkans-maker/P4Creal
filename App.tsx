
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
            id: Date.now().toString(), role: 'assistant', content: "Bağlantıda bir sorun oldu, lütfen tekrar dene.", timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full ethereal-bg h-full overflow-hidden">
      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full bg-slate-900 border-r border-white/5">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={(e, id) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(activeSessionId === id) setActiveSessionId(null); }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-0 md:p-6 relative z-10 h-full">
        {/* Main Interface Container - Responsive Scale */}
        <div className="w-full max-w-2xl h-full flex flex-col md:glass-card md:rounded-[2.5rem] relative overflow-hidden transition-all duration-500 bg-slate-900/40 md:bg-transparent">
          
          {/* Header - Sleeker scaling */}
          <header className="flex items-center justify-between px-5 py-4 md:py-6 shrink-0 z-30 border-b border-white/5">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/40 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg p-1 w-6 h-6 md:w-9 md:h-9 flex items-center justify-center shadow-md">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-[9px] md:text-[11px] tracking-tight text-white/80 uppercase">NEXTGENLAB</span>
              </div>
              <div className="h-3 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-2">
                <img src={SECOND_LOGO_URL} alt="P4C" className="h-6 md:h-12 object-contain" />
              </div>
            </div>

            <button onClick={handleNewChat} className="p-2 text-white/40 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </header>

          {/* Body Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-700">
                <div className="space-y-6 md:space-y-8">
                  <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Sor. Düşün.<br/> 
                    <span className="gradient-text">Yapay Zeka</span> ile<br/> 
                    Keşfet.
                  </h2>
                  
                  <div className="bg-white/5 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 soft-pulse">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]"></span>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                      GELECEĞİN EĞİTİMİ
                    </p>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => handleSend("Selam! Bugün birlikte felsefi bir keşfe çıkmaya ne dersin?")}
                      className="main-btn px-10 py-4 rounded-full text-white font-bold text-sm md:text-lg tracking-tight shadow-xl"
                    >
                      Birlikte Keşfedelim
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-10 py-6 space-y-6 md:space-y-10">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] md:max-w-[85%] px-5 py-4 md:px-8 md:py-6 rounded-2xl md:rounded-3xl ${
                      msg.role === 'user' 
                        ? 'chat-bubble-user text-white font-semibold' 
                        : 'chat-bubble-ai'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm md:text-xl leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-6">
                          {msg.data ? (
                            <div className="space-y-6 text-left">
                              <div>
                                <label className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1 opacity-80">Duygu Tasdiki</label>
                                <p className="text-base md:text-2xl font-black text-white leading-tight">"{msg.data.empathy}"</p>
                              </div>
                              <div>
                                <label className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1 opacity-80">Felsefi Bakış</label>
                                <p className="text-xs md:text-lg text-slate-300 font-medium leading-relaxed">{msg.data.suggestion}</p>
                              </div>
                              <div className="p-5 md:p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-xl md:rounded-2xl">
                                <label className="text-[8px] md:text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2 opacity-60">P4C SORUSU</label>
                                <p className="text-lg md:text-3xl font-black text-white leading-snug tracking-tight">{msg.data.question}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm md:text-xl leading-relaxed font-bold">{msg.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 text-indigo-400 px-4 items-center opacity-50 scale-75 origin-left">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input - ChatGPT Style Minimalist */}
          <footer className="px-4 py-4 md:px-10 md:py-8 shrink-0 z-40">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] p-1 shadow-inner focus-within:border-indigo-500/50 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Mesajınızı yazın..."
                className="flex-1 max-h-32 py-3 px-4 md:px-6 bg-transparent border-none focus:ring-0 text-sm md:text-lg text-white placeholder:text-white/20 resize-none no-scrollbar"
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
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white shadow-lg scale-100' 
                    : 'bg-white/5 text-white/5 scale-90'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
            <p className="text-[8px] md:text-[10px] text-white/20 text-center mt-3 uppercase tracking-widest font-bold">
              NextGenLAB AI – Fikir Keşif Asistanı
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
