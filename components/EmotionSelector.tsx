
import React from 'react';
import { Emotion } from '../types';

interface EmotionSelectorProps {
  selected: Emotion | null;
  onSelect: (emotion: Emotion) => void;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({ selected, onSelect }) => {
  const emotions = [
    { type: Emotion.SAD, icon: '😔', color: 'hover:bg-blue-50 border-blue-200 bg-white' },
    { type: Emotion.ANGRY, icon: '😡', color: 'hover:bg-red-50 border-red-200 bg-white' },
    { type: Emotion.LONELY, icon: '👤', color: 'hover:bg-purple-50 border-purple-200 bg-white' },
    { type: Emotion.CONFUSED, icon: '🤔', color: 'hover:bg-yellow-50 border-yellow-200 bg-white' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {emotions.map((item) => (
        <button
          key={item.type}
          onClick={() => onSelect(item.type)}
          className={`
            flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200
            ${selected === item.type 
              ? 'border-indigo-600 bg-indigo-50 shadow-inner scale-[0.98]' 
              : `${item.color} shadow-sm active:scale-95`}
          `}
        >
          <span className="text-4xl mb-3">{item.icon}</span>
          <span className="font-semibold text-slate-700">{item.type}</span>
        </button>
      ))}
    </div>
  );
};

export default EmotionSelector;
