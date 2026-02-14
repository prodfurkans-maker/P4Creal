
import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-300 p-6 border-r border-slate-800">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          NG
        </div>
        <div>
          <h1 className="text-white font-bold leading-none">Next Gen Lab</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Empati AI v2.0</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Hakkında</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            P4C Edition, çocukların duygularını felsefi bir derinlikle keşfetmeleri için tasarlanmıştır.
          </p>
        </div>

        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-xs text-indigo-300 leading-relaxed italic">
            "Sorgulanmamış bir hayat, yaşanmaya değer değildir." 
            <span className="block mt-1 font-bold">— Sokrates</span>
          </p>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Sınıf Modu Aktif
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
