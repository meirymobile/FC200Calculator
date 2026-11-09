import React from 'react';

interface DpadNavigationProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
}

export const DpadNavigation: React.FC<DpadNavigationProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
}) => {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer circular blue-gray housing */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-[#41556b] via-[#36475a] to-[#2b3a4a] p-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-[#1f2a36]">
        
        {/* Subtle grooved ring */}
        <div className="w-full h-full rounded-full bg-[#324253] relative flex items-center justify-center shadow-inner">
          
          {/* UP Button */}
          <button
            type="button"
            onClick={onUp}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-7 flex items-start justify-center pt-1 text-[#d8e3ed] hover:text-white active:translate-y-0.5 transition-transform"
            title="למעלה"
          >
            <span className="text-xs font-black drop-shadow">▲</span>
          </button>

          {/* DOWN Button */}
          <button
            type="button"
            onClick={onDown}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-7 flex items-end justify-center pb-1 text-[#d8e3ed] hover:text-white active:-translate-y-0.5 transition-transform"
            title="למטה"
          >
            <span className="text-xs font-black drop-shadow">▼</span>
          </button>

          {/* LEFT Button */}
          <button
            type="button"
            onClick={onLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-10 flex items-center justify-start pl-1.5 text-[#d8e3ed] hover:text-white active:translate-x-0.5 transition-transform"
            title="שמאלה"
          >
            <span className="text-xs font-black drop-shadow">◄</span>
          </button>

          {/* RIGHT Button */}
          <button
            type="button"
            onClick={onRight}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-10 flex items-center justify-end pr-1.5 text-[#d8e3ed] hover:text-white active:-translate-x-0.5 transition-transform"
            title="ימינה"
          >
            <span className="text-xs font-black drop-shadow">►</span>
          </button>

          {/* Center REPLAY medallion in blue-gray */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#253240] to-[#3a4c5e] flex flex-col items-center justify-center border border-[#485e75]/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none">
            <span className="text-[8px] sm:text-[9px] font-extrabold tracking-widest text-[#a8bcd0] uppercase font-sans">
              REPLAY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
