
import React from 'react';

const Sidebar: React.FC = () => {
  const isKeyActive = !!process.env.API_KEY;

  return (
    <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white p-8 border-r border-slate-800 shadow-2xl">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
          NG
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight leading-none">Next Gen Lab</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">P4C Edition</p>
        </div>
      </div>

      <div className="flex-1 space-y-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vizyonumuz</label>
          <p className="text-sm leading-relaxed text-slate-400 font-medium">
            Çocukların duygusal zekasını felsefi sorgulama (P4C) ile birleştirerek yarının dünyasına hazırlıyoruz.
          </p>
        </div>

        <div className="p-6 bg-slate-800/50 rounded-[2rem] border border-slate-700/50 space-y-3">
          <span className="text-2xl">🏛️</span>
          <p className="text-xs text-slate-300 leading-relaxed italic font-medium">
            "Sorgulanmamış bir hayat, yaşanmaya değer değildir."
            <span className="block mt-2 font-black text-indigo-400">— Sokrates</span>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${isKeyActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isKeyActive ? 'Sistem Aktif' : 'Kurulum Bekleniyor'}
          </span>
        </div>
        <p className="text-[9px] text-slate-600 font-bold leading-tight uppercase tracking-tighter">
          © 2024 Next Gen Lab <br/> Tüm Hakları Saklıdır
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
