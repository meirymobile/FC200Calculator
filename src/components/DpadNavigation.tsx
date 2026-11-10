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
    <div dir="ltr" style={{ direction: 'ltr' }} className="relative flex items-center justify-center select-none py-1">
      {/* Outer Black Cross / Diamond D-Pad Housing matching FC-200V 2nd edition */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Diamond / Cross Matte Black Pad with concentric ring texture */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#22242a] via-[#1a1c22] to-[#141519] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_2px_rgba(0,0,0,0.8)] border border-[#2d313a]">
          
          {/* UP Button with concentric ridges */}
          <button
            type="button"
            onClick={onUp}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-8 flex flex-col items-center justify-start pt-1 text-zinc-300 hover:text-white active:translate-y-0.5 transition-transform group"
            title="למעלה"
          >
            <span className="text-[10px] font-black group-hover:scale-110 drop-shadow">▲</span>
            <div className="w-5 h-1 rounded-full border-t border-zinc-600/60 mt-0.5 opacity-60" />
          </button>

          {/* DOWN Button with concentric ridges */}
          <button
            type="button"
            onClick={onDown}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-8 flex flex-col items-center justify-end pb-1 text-zinc-300 hover:text-white active:-translate-y-0.5 transition-transform group"
            title="למטה"
          >
            <div className="w-5 h-1 rounded-full border-b border-zinc-600/60 mb-0.5 opacity-60" />
            <span className="text-[10px] font-black group-hover:scale-110 drop-shadow">▼</span>
          </button>

          {/* LEFT Button */}
          <button
            type="button"
            onClick={onLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-10 flex items-center justify-start pl-1 text-zinc-300 hover:text-white active:translate-x-0.5 transition-transform group"
            title="שמאלה"
          >
            <span className="text-[10px] font-black group-hover:scale-110 drop-shadow">◄</span>
          </button>

          {/* RIGHT Button */}
          <button
            type="button"
            onClick={onRight}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-10 flex items-center justify-end pr-1 text-zinc-300 hover:text-white active:-translate-x-0.5 transition-transform group"
            title="ימינה"
          >
            <span className="text-[10px] font-black group-hover:scale-110 drop-shadow">►</span>
          </button>

          {/* Center recessed diamond */}
          <div className="absolute inset-0 m-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#121317] to-[#1e2026] border border-zinc-700/40 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800/80 border border-zinc-700/50" />
          </div>
        </div>
      </div>
    </div>
  );
};
