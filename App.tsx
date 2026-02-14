
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Message } from './types';
import { getEmpathyResponse } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (input.length > 300) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await getEmpathyResponse(input);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '', // Data içinde tutuluyor
        timestamp: Date.now(),
        data
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu an bağlantı kurulamadı. Lütfen tekrar dene.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">NG</div>
          <span className="font-bold text-slate-800">Next Gen Lab</span>
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                <span className="text-4xl text-indigo-600 animate-bounce">✨</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                Zihnindeki Düşünceleri Paylaşmaya Ne Dersin?
              </h2>
              <p className="text-slate-500 text-lg">
                Bugün olanları veya seni düşündüren bir olayı anlatabilirsin. Birlikte felsefi bir yolculuğa çıkalım.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-4">
                <button onClick={() => setInput("Arkadaşımla tartıştım ve kendimi biraz üzgün hissediyorum.")} className="p-4 text-sm text-left border rounded-2xl hover:bg-slate-50 transition-colors">"Arkadaşımla tartıştım ve..."</button>
                <button onClick={() => setInput("Sınavdan beklediğim notu alamadığım için hayal kırıklığına uğradım.")} className="p-4 text-sm text-left border rounded-2xl hover:bg-slate-50 transition-colors">"Sınavdan düşük aldım ve..."</button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 md:p-6 ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-lg' 
                : 'bg-slate-50 text-slate-800 rounded-bl-none border border-slate-100'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-base md:text-lg leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="space-y-6">
                    {msg.data ? (
                      <>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Empati</span>
                          <p className="text-lg italic font-medium">"{msg.data.empathy}"</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Düşünce Önerisi</span>
                          <p className="text-sm leading-relaxed">{msg.data.suggestion}</p>
                        </div>
                        <div className="p-4 bg-indigo-600/5 border-l-4 border-indigo-500 rounded-r-xl">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">P4C Soru Kartı</span>
                          <p className="text-base font-bold text-slate-900">{msg.data.question}</p>
                        </div>
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-50 rounded-3xl rounded-bl-none p-6 border border-slate-100 flex gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Düşüncelerini buraya yazabilirsin..."
              className="w-full p-5 md:p-6 pr-16 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 focus:ring-0 transition-all shadow-xl resize-none max-h-40 min-h-[80px] text-lg text-slate-800 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-4 bottom-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                input.trim() && !isLoading ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div className="mt-4 flex justify-between items-center max-w-4xl mx-auto px-4 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            <span>Maksimum 300 Karakter</span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Eğitim Güvenliği Modu Aktif
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
