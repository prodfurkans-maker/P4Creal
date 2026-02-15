
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession
}) => {
  const LOGO_URL = "https://lh3.googleusercontent.com/d/1iuS4shzoEIy9xsMHhm7AUyMKmuZ9WCgp";

  return (
    <aside className="flex flex-col w-full h-full bg-slate-950 text-white border-r border-white/5 shadow-2xl">
      <div className="p-6">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-sm font-black group shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 w-7 h-7 flex items-center justify-center">
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span>Yeni Sohbet</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6 no-scrollbar">
        <div className="mt-4 mb-3 px-3">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">Son Sohbetler</label>
        </div>
        
        {sessions.length === 0 && (
          <div className="px-3 py-6 text-center border border-dashed border-white/5 rounded-2xl">
            <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">Sohbet Geçmişi Boş</p>
          </div>
        )}

        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
              activeSessionId === session.id 
              ? 'bg-white/10 text-white shadow-lg' 
              : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeSessionId === session.id ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`}></div>
            <span className="text-xs truncate flex-1 font-bold leading-none">{session.title}</span>
            <button 
              onClick={(e) => onDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all p-2 bg-slate-900 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-white/5">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-indigo-500/20">NG</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-slate-200">NextGen Kaşif</p>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Premium Üye</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
