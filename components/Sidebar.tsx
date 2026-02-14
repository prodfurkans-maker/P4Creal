
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
    <aside className="flex flex-col w-full h-full bg-slate-950 text-white border-r border-slate-800 shadow-2xl">
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-bold group"
        >
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-5 h-5 object-contain" />
            <span>Yeni Sohbet</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        <div className="mt-4 mb-2 px-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Geçmiş</label>
        </div>
        
        {sessions.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-500 font-medium italic">Henüz sohbet yok.</p>
        )}

        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              activeSessionId === session.id 
              ? 'bg-white/10 text-white' 
              : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            <span className="text-xs truncate flex-1 font-semibold">{session.title}</span>
            <button 
              onClick={(e) => onDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">NG</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Genç Kaşif</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Premium Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
