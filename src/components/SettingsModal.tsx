import React from 'react';
import {
  X,
  Calculator,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Smartphone,
  Home,
  Car,
  TrendingUp,
  Briefcase,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PresetType } from './FinancialPresets';
import { toggleSound, isSoundEnabled } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: 'split' | 'calcOnly' | 'reportsOnly';
  onSelectLayout: (mode: 'split' | 'calcOnly' | 'reportsOnly') => void;
  onSelectPreset: (preset: PresetType) => void;
  onOpenGuide: () => void;
  onOpenInstall: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  layoutMode,
  onSelectLayout,
  onSelectPreset,
  onOpenGuide,
  onOpenInstall,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#16181f] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-bold text-white">הגדרות ותפריט סטודיו</h2>
              <p className="text-[11px] text-zinc-400">Casio FC-200V Studio Menu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: View Mode */}
        <div className="mb-5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            תצוגת מסך
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectLayout('calcOnly');
                onClose();
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                layoutMode === 'calcOnly'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>מחשבון בלבד</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLayout('reportsOnly');
                onClose();
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                layoutMode === 'reportsOnly'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>דוחות ואקסל</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLayout('split');
                onClose();
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                layoutMode === 'split'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>משולב</span>
            </button>
          </div>
        </div>

        {/* Section 2: Quick Presets */}
        <div className="mb-5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            דוגמאות פיננסיות מוכנות (Presets)
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectPreset('mortgage');
                onClose();
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-right transition-colors"
            >
              <Home className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">משכנתא 1M ₪</div>
                <div className="text-[10px] text-zinc-400">25 שנה, 4.8%</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPreset('car');
                onClose();
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-right transition-colors"
            >
              <Car className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white">הלוואת רכב 120K</div>
                <div className="text-[10px] text-zinc-400">5 שנים, 6%</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPreset('savings');
                onClose();
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-right transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white">חיסכון 2K/חודש</div>
                <div className="text-[10px] text-zinc-400">20 שנה, 7%</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPreset('cashflow');
                onClose();
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-right transition-colors"
            >
              <Briefcase className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-bold text-white">תזרים פרויקט</div>
                <div className="text-[10px] text-zinc-400">השקעה 100K</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Tools & Sound */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGuide();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>מדריך שימוש מפורט במחשבון</span>
            </div>
            <span className="text-zinc-500">←</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInstall();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700/80 to-indigo-700/80 hover:from-blue-600 hover:to-indigo-600 border border-blue-500/40 flex items-center justify-between text-xs font-bold text-white transition-all shadow"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>התקנה לנייד / הורדת APK</span>
            </div>
            <span className="text-blue-200">הורדה</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSoundOn(toggleSound());
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <span>צלילי מקשים פיזיים (Mechanical Sound)</span>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded ${soundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {soundOn ? 'פעיל' : 'מושתק'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
