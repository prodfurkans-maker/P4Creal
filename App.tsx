
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message } from './types.ts';
import { getEmpathyResponse } from './services/geminiService.ts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const data = await getEmpathyResponse(currentInput);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        data
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      let errorMessage = "Bir sorun oluştu, lütfen tekrar deneyin.";
      
      if (err.message === "API_KEY_MISSING") {
        errorMessage = "API Anahtarı eksik. Lütfen Vercel panelinden API_KEY tanımlayın.";
      } else if (err.message?.includes("API key not valid")) {
        errorMessage = "API Anahtarı geçersiz. Lütfen anahtarınızı kontrol edin.";
      }

      setError(errorMessage);
      
      const assistantErrorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sistem Uyarısı: ${errorMessage}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">NG</div>
            <span className="font-bold text-slate-800">Next Gen Lab</span>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 md:px-12 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <span className="text-5xl animate-pulse">💡</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Sokratik Bir Sohbet <br/> <span className="text-indigo-600">Başlatmaya Ne Dersin?</span>
                </h2>
                <p className="text-slate-500 text-lg md:text-xl font-medium">
                  Düşüncelerini, hislerini veya bugün seni meşgul eden herhangi bir şeyi yazabilirsin.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => setInput("Arkadaşlarımla aramdaki bir anlaşmazlık üzerine düşünüyorum...")} 
                  className="p-5 text-left border-2 border-slate-100 rounded-3xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-slate-600 font-medium"
                >
                  "Arkadaşlarımla aramda..."
                </button>
                <button 
                  onClick={() => setInput("Kendi kararlarımı alırken bazen zorlanıyorum, çünkü...")} 
                  className="p-5 text-left border-2 border-slate-100 rounded-3xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-slate-600 font-medium"
                >
                  "Karar alırken zorlanıyorum..."
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
              <div className={`max-w-[90%] md:max-w-[80%] p-6 md:p-8 rounded-[2rem] shadow-sm ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-lg leading-relaxed font-medium">{msg.content}</p>
                ) : (
                  <div className="space-y-6">
                    {msg.data ? (
                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-2">Duygusal Yankı</label>
                          <p className="text-xl italic font-semibold leading-snug">"{msg.data.empathy}"</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-2">Felsefi Perspektif</label>
                          <p className="text-base leading-relaxed text-slate-600">{msg.data.suggestion}</p>
                        </div>
                        <div className="p-6 bg-white border-2 border-indigo-100 rounded-3xl shadow-sm">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] block mb-2">P4C Soru Kartı</label>
                          <p className="text-lg font-bold text-slate-900 leading-tight">{msg.data.question}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] rounded-bl-none p-8 flex gap-3 items-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Düşünülüyor...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 chat-gradient border-t lg:border-t-0 bg-white">
          <div className="max-w-4xl mx-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 animate-in shake">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}
            
            <div className="relative flex items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Düşüncelerini buraya yaz..."
                className="w-full p-6 md:p-8 pr-20 bg-white border-2 border-slate-100 rounded-[2.5rem] focus:border-indigo-400 focus:ring-0 transition-all shadow-2xl shadow-indigo-100/50 resize-none max-h-48 min-h-[90px] text-lg font-medium text-slate-800"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-4 bottom-4 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isLoading 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:scale-110 active:scale-95' 
                  : 'bg-slate-100 text-slate-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Next Gen Lab P4C Asistanı • Terapötik Destek Değildir
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
