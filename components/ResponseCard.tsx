
import React from 'react';
import { GeminiResponse } from '../types';

interface ResponseCardProps {
  response: GeminiResponse;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ response }) => {
  return (
    <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
            <h3 className="text-indigo-600 font-bold text-sm uppercase tracking-wider">Empati</h3>
          </div>
          <p className="text-lg md:text-xl text-slate-800 font-medium italic">
            {/* Fix: Changed empathy to reflection as defined in GeminiResponse */}
            "{response.reflection}"
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">2</span>
            <h3 className="text-green-600 font-bold text-sm uppercase tracking-wider">Hikaye</h3>
          </div>
          <p className="text-base text-slate-700 leading-relaxed">
            {/* Fix: Changed suggestion to storyContent with a fallback for optional field */}
            {response.storyContent || "Hikaye devam ediyor..."}
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">3</span>
            <h3 className="text-amber-600 font-bold text-sm uppercase tracking-wider">P4C Düşünme Sorusu</h3>
          </div>
          <p className="text-lg text-slate-900 font-semibold border-l-4 border-amber-400 pl-4 py-1">
            {response.question}
          </p>
        </section>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
        <span>BİLGİ: Bu bir terapi değildir.</span>
        <span>© 2024 Next Gen Lab</span>
      </div>
    </div>
  );
};

export default ResponseCard;
