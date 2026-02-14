
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import { Message } from './types.ts';
import { getEmpathyResponse } from './services/geminiService.ts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!process.env.API_KEY);
  const scrollRef = useRef<HTMLDivElement>(null);

  // API Key kontrolü
  useEffect(() => {
    const checkKey = async () => {
      if (!process.env.API_KEY && window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Race condition için direkt true varsayıyoruz
    } else {
      setError("Bu ortamda API Key seçici desteklenmiyor. Lütfen Vercel ayarlarını kontrol edin.");
    }
  };

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
      let errorMessage = "Bir sorun oluştu.";
      
      if (err.message?.includes("Requested entity was not found") || err.message === "API_KEY_MISSING") {
        setHasApiKey(false);
        errorMessage = "API Bağlantısı kesildi. Lütfen tekrar yetkilendirin.";
      }

      setError(errorMessage);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sistem Uyarısı: ${errorMessage}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasApiKey && !process.env.API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mb-8 shadow-2xl">NG</div>
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Next Gen Lab P4C Asistanı</h1>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Güvenli ve felsefi bir sohbet deneyimi için Gemini API bağlantısını kurmamız gerekiyor.
        </p>
        <button 
          onClick={handleOpenKeySelector}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95"
        >
          API Anahtarını Etkinleştir
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-6 text-xs text-slate-400 hover:underline">
          Faturalandırma Hakkında Bilgi
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="lg:hidden p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">NG</div>
            <span className="font-bold text-slate-800">Next Gen Lab</span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 md:px-12 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <span className="text-5xl animate-pulse">🏛️</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Düşüncelerine <br/> <span className="text-indigo-600">Felsefi Bir Pencere Aç</span>
                </h2>
                <p className="text-slate-500 text-lg md:text-xl font-medium">
                  Bugün seni meşgul eden bir konuyu veya duyguyu paylaşabilirsin.
                </p>
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
                  <p className="text-lg leading-relaxed font-medium">{String(msg.content)}</p>
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
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">{String(msg.content)}</p>
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
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sorgulanıyor...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-10 bg-white border-t lg:border-t-0">
          <div className="max-w-4xl mx-auto space-y-4">
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
