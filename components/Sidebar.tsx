
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
    <aside className="flex flex-col w-full h-full bg-white text-slate-900 border-r border-slate-100">
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition-all text-xs font-bold group"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-lg p-1 w-6 h-6 flex items-center justify-center shadow-sm">
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-slate-600 group-hover:text-indigo-600">Yeni Sohbet</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 group-hover:opacity-100 group-hover:text-indigo-600 transition-all"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-6 no-scrollbar">
        <div className="mt-4 mb-2 px-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">GEÇMİŞ</label>
        </div>
        
        {sessions.length === 0 && (
          <div className="px-3 py-8 text-center border border-dashed border-slate-100 rounded-xl opacity-40">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sohbet Yok</p>
          </div>
        )}

        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              activeSessionId === session.id 
              ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
              : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeSessionId === session.id ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
            <span className="text-[11px] truncate flex-1 font-bold tracking-tight">{session.title}</span>
            <button 
              onClick={(e) => onDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">NG</div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate text-slate-700">NextGen Kaşif</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
