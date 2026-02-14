
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            NG
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              Next Gen Lab
            </h1>
            <p className="text-sm text-indigo-600 font-medium">Empati Yapay Zeka – P4C Edition</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            Eğitim Modu
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
