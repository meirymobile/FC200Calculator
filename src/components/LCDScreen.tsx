import React from 'react';
import { CalculatorMode, PaymentTiming } from '../types/calculator';
import { formatCasioLCD } from '../utils/casioFormat';

interface LCDScreenProps {
  mode: CalculatorMode;
  paramName: string;
  paramValue: string;
  editValue: string;
  isEditing: boolean;
  canSolve: boolean;
  hasUp: boolean;
  hasDown: boolean;
  isShift: boolean;
  isAlpha: boolean;
  timing: PaymentTiming;
  statusMessage?: string;
  compExpression?: string;
}

export const LCDScreen: React.FC<LCDScreenProps> = ({
  mode,
  paramName,
  paramValue,
  editValue,
  isEditing,
  canSolve,
  hasUp,
  hasDown,
  isShift,
  isAlpha,
  timing,
  statusMessage,
  compExpression,
}) => {
  return (
    <div className="relative w-full rounded-md p-3 sm:p-4 bg-[#92a494] shadow-[inset_0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.15)] border-2 border-[#121413] text-[#142017] font-['Share_Tech_Mono',monospace] select-none overflow-hidden">
      {/* Subtle LCD pixel grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]"
        aria-hidden="true"
      />

      {/* Top Indicators Bar (Annunciators) */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#142017]/15 pb-1 mb-1 sm:mb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`px-1 rounded ${isShift ? 'bg-[#142017] text-[#92a494]' : 'text-[#142017]/30'}`}>
            S
          </span>
          <span className={`px-1 rounded ${isAlpha ? 'bg-[#142017] text-[#92a494]' : 'text-[#142017]/30'}`}>
            A
          </span>
          <span className="text-[#142017]">
            {mode}
          </span>
          {mode === 'CMPD' && (
            <span className="font-extrabold text-[#142017] bg-[#142017]/10 px-1 rounded">
              {timing === 'Begin' ? 'B (BEGIN)' : 'END'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {canSolve && (
            <span className="animate-pulse bg-[#142017] text-[#92a494] px-1.5 py-0.2 rounded font-extrabold tracking-widest text-[9px]">
              [SOLVE]
            </span>
          )}
          <div className="flex items-center gap-0.5 font-bold">
            <span className={hasUp ? 'text-[#142017]' : 'text-[#142017]/20'}>▲</span>
            <span className={hasDown ? 'text-[#142017]' : 'text-[#142017]/20'}>▼</span>
          </div>
          <span className="text-[#142017] font-bold">DEG</span>
        </div>
      </div>

      {/* Screen Line 1: Dot Matrix Menu / Parameter or Expression */}
      <div className="h-6 sm:h-7 flex items-center justify-between text-sm sm:text-base font-semibold tracking-wide border-b border-dashed border-[#142017]/15">
        {mode === 'COMP' ? (
          <div className="truncate w-full font-mono text-left rtl:text-right" dir="ltr">
            {compExpression || '0'}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#101912]">{paramName}</span>
              <span className="text-xs text-[#142017]/70">=</span>
            </div>
            {statusMessage && (
              <span className="text-xs font-bold bg-[#142017]/10 px-2 py-0.5 rounded animate-pulse">
                {statusMessage}
              </span>
            )}
          </>
        )}
      </div>

      {/* Screen Line 2: Large Main Display (Param Value or Calculation Result) with full 10-digit precision */}
      <div className="h-10 sm:h-12 flex items-center justify-end font-mono text-xl sm:text-2xl font-extrabold tracking-tight mt-1" dir="ltr">
        {isEditing ? (
          <div className="flex items-center">
            <span>{editValue || '0'}</span>
            <span className="inline-block w-2.5 h-6 bg-[#142017] ml-0.5 animate-pulse" />
          </div>
        ) : (
          <div className="truncate tracking-wide">{formatCasioLCD(paramValue)}</div>
        )}
      </div>
    </div>
  );
};

