
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
    let updatedSessions = [...sessions];

    if (!currentSessionId) {
      const newId = Date.now().toString();
      const title = await generateTitle(messageText);
      const newSession: ChatSession = {
        id: newId,
        title: title,
        messages: [userMsg],
        createdAt: Date.now()
      };
      updatedSessions = [newSession, ...updatedSessions];
      setSessions(updatedSessions);
      setActiveSessionId(newId);
      currentSessionId = newId;
    } else {
      updatedSessions = updatedSessions.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
      );
      setSessions(updatedSessions);
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
            content: "İşlem sırasında küçük bir aksaklık oldu. Lütfen tekrar dener misin?",
            timestamp: Date.now()
          }] 
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900">
      {/* Sidebar Wrapper */}
      <div className={`fixed inset-0 z-50 lg:relative lg:flex lg:inset-auto ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 h-full">
          <Sidebar 
            sessions={sessions} 
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDeleteSession={deleteSession}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fbfbfb] mesh-bg overflow-hidden h-screen">
        {/* Header Section */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/60 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-7 h-7 object-contain" />
              <h1 className="font-bold text-slate-800 tracking-tight text-sm md:text-base">
                {activeSession ? activeSession.title : "NextGenLAB"}
              </h1>
            </div>
          </div>
          <button 
            onClick={handleNewChat}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        {/* Dynamic Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth h-full">
          {!activeSessionId ? (
            <div className="min-h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-6 py-4 md:py-12 space-y-6 md:space-y-12 animate-in fade-in duration-1000">
              
              {/* Centered Dual Logos - Enlarged */}
              <div className="logo-container inline-flex items-center gap-6 md:gap-10 p-5 md:p-8 rounded-[3rem] shadow-sm transform scale-90 md:scale-100">
                <img src={LOGO_URL} alt="NextGen Lab Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                <div className="h-12 w-px bg-slate-200"></div>
                <img src={SECOND_LOGO_URL} alt="Partner Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
              </div>
              
              {/* Typography-focused Slogans */}
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-6xl font-[900] text-slate-900 tracking-tighter leading-[1.1]">
                    Düşüncelerini<br/> 
                    <span className="text-indigo-600">Özgürce Keşfet.</span>
                  </h2>
                </div>
                <div className="space-y-3 md:space-y-5">
                  <p className="text-slate-500 text-base md:text-xl font-medium tracking-tight px-4">
                    "Yapay Zeka Çağında Düşünen Nesiller."
                  </p>
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <span className="hidden md:block h-px w-8 bg-blue-100"></span>
                    <p className="text-blue-600 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] bg-blue-50/50 px-3 md:px-4 py-1.5 rounded-full">
                      P4C + Yapay Zeka = Geleceğin Eğitimi.
                    </p>
                    <span className="hidden md:block h-px w-8 bg-blue-100"></span>
                  </div>
                </div>
              </div>

              {/* Starter Suggestions - Compact on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full pt-4 md:pt-8">
                <button 
                  onClick={() => handleSend("Bugün hayal gücümün sınırlarını nasıl zorlayabilirim?")}
                  className="p-4 md:p-6 text-left bg-white border border-slate-100 rounded-2xl md:rounded-3xl hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                >
                  <span className="block text-indigo-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-3">Yaratıcılık</span>
                  <p className="text-slate-800 font-bold text-xs md:text-sm leading-relaxed">"Hayal kurmak sence zihnimizin bir süper gücü müdür?"</p>
                </button>
                <button 
                  onClick={() => handleSend("Doğru ve yanlış arasındaki çizgiyi nasıl belirleriz?")}
                  className="p-4 md:p-6 text-left bg-white border border-slate-100 rounded-2xl md:rounded-3xl hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group"
                >
                  <span className="block text-emerald-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-3">Etik</span>
                  <p className="text-slate-800 font-bold text-xs md:text-sm leading-relaxed">"İyi bir insan olmayı sağlayan şey sadece yaptıklarımız mıdır?"</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-8 py-10 px-4 md:px-0 pb-32">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[85%] md:max-w-[80%] px-6 py-4 rounded-[1.5rem] ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white font-medium shadow-md shadow-slate-200' 
                    : 'bg-white shadow-sm border border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm md:text-base leading-relaxed tracking-tight">{msg.content}</p>
                    ) : (
                      <div className="space-y-8">
                        {msg.data ? (
                          <div className="space-y-8 py-2">
                            <div className="animate-in fade-in duration-700">
                              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2 opacity-60">Empati Duyumu</label>
                              <p className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug">"{msg.data.empathy}"</p>
                            </div>
                            <div className="animate-in fade-in duration-700 delay-150">
                              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2 opacity-60">Felsefi Perspektif</label>
                              <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">{msg.data.suggestion}</p>
                            </div>
                            <div className="p-6 md:p-8 bg-[#f5f8ff] rounded-[2rem] border border-indigo-50 shadow-inner animate-in zoom-in-95 duration-500 delay-300">
                              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-3">Sokratik Soru (P4C)</label>
                              <p className="text-xl md:text-2xl font-black text-slate-900 leading-[1.2] tracking-tight">{msg.data.question}</p>
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
                <div className="flex items-center gap-3 text-slate-300 px-4">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input & Footer Area - Fixed height and background */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-white via-white/95 to-transparent relative z-20 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-slate-200 rounded-[24px] md:rounded-[28px] shadow-sm focus-within:shadow-xl focus-within:border-indigo-200 transition-all duration-300 p-2 md:p-2.5 pl-4 md:pl-5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini buraya fısılda..."
                className="flex-1 max-h-32 md:max-h-48 min-h-[40px] md:min-h-[44px] py-2 md:py-3 bg-transparent border-none focus:ring-0 text-sm md:text-base font-semibold text-slate-800 placeholder:text-slate-300 resize-none"
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
                className={`mb-1 p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all duration-300 ${
                  input.trim() && !isLoading 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:scale-105 active:scale-95' 
                  : 'bg-slate-50 text-slate-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
            
            {/* Custom Footer Vizyon - Smaller on Mobile */}
            <div className="mt-2 md:mt-4 flex flex-col items-center gap-1 opacity-70">
               <p className="text-center text-[8px] md:text-[11px] text-slate-500 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em]">
                Empati + Felsefe + Yapay Zeka = Geleceğin Çocukları.
              </p>
              <div className="h-px w-8 md:w-12 bg-slate-200"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
