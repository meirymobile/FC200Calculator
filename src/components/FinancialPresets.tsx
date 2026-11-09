import React from 'react';
import { Home, Car, PiggyBank, Briefcase } from 'lucide-react';

export type PresetType = 'mortgage' | 'car' | 'savings' | 'cashflow';

interface FinancialPresetsProps {
  onSelectPreset: (preset: PresetType) => void;
}

export const FinancialPresets: React.FC<FinancialPresetsProps> = ({ onSelectPreset }) => {
  const presets: { id: PresetType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'mortgage',
      label: 'משכנתא 1,000,000 ₪',
      desc: '25 שנה בריבית 4.8%',
      icon: <Home className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      id: 'car',
      label: 'הלוואת רכב 120,000 ₪',
      desc: '5 שנים בריבית 6.0%',
      icon: <Car className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'savings',
      label: 'חיסכון וצבירה עתידית',
      desc: '2,000 ₪/חודש ל-20 שנה (7%)',
      icon: <PiggyBank className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'cashflow',
      label: 'כדאיות פרויקט (CASH)',
      desc: 'השקעה 100K ₪ ותקבולים שנתיים',
      icon: <Briefcase className="w-3.5 h-3.5 text-purple-400" />,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mb-4 px-2 select-none">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap hidden sm:inline">
          דוגמאות מהירות:
        </span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset(p.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-200 transition-all whitespace-nowrap shadow-sm active:scale-95 group"
            title={p.desc}
          >
            <span className="group-hover:scale-110 transition-transform">{p.icon}</span>
            <span className="font-semibold">{p.label}</span>
            <span className="text-[10px] text-zinc-400 hidden md:inline">({p.desc})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

