import React, { useState, useRef, useEffect } from 'react';
import { CalculatorMode, PaymentTiming } from '../types/calculator';
import { formatCasioLCD } from '../utils/casioFormat';
import { triggerHaptic, playKeyClick } from '../utils/soundEffects';
import { copyNumberToClipboard, pasteNumberFromClipboard } from '../utils/clipboard';
import { ChevronUp, Copy, Check, Sparkles, ClipboardPaste } from 'lucide-react';

export interface MenuItem {
  key: string;
  label: string;
  value: string | number;
  canSolve: boolean;
  isTiming?: boolean;
}

interface ExpandedTouchScreenProps {
  mode: CalculatorMode;
  menuItems: MenuItem[];
  activeIndex: number;
  isEditing: boolean;
  editValue: string;
  onSelectParam: (index: number) => void;
  onSolveParam: (key: string) => void;
  onPasteParam?: (index: number, key: string, value: string) => void;
  onToggleTiming?: () => void;
  onCollapse: () => void;
  onSelectMode?: (newMode: CalculatorMode) => void;
  timing: PaymentTiming;
  isShift: boolean;
  isAlpha: boolean;
  statusMessage?: string;
  compExpression?: string;
  compResult?: string;
  compHistory?: Array<{ expr: string; result: string }>;
}

export const ExpandedTouchScreen: React.FC<ExpandedTouchScreenProps> = ({
  mode,
  menuItems,
  activeIndex,
  isEditing,
  editValue,
  onSelectParam,
  onSolveParam,
  onPasteParam,
  onToggleTiming,
  onCollapse,
  onSelectMode,
  timing,
  isShift,
  isAlpha,
  statusMessage,
  compExpression,
  compResult,
  compHistory = [],
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  const handleCopyValue = async (value: string | number, label: string) => {
    const strVal = String(value);
    triggerHaptic('solve');
    const success = await copyNumberToClipboard(strVal);
    if (success) {
      showToast(`✓ הועתק ללוח: ${strVal}`);
    } else {
      showToast(`ערך: ${strVal}`);
    }
  };

  const handlePasteIntoParam = async (index: number, key: string) => {
    const pasted = await pasteNumberFromClipboard();
    if (pasted) {
      triggerHaptic('solve');
      onPasteParam?.(index, key, pasted);
      showToast(`✓ הודבק ל-${menuItems[index]?.label || 'פרמטר'}: ${pasted}`);
    } else {
      triggerHaptic('del');
      showToast('לוח ההעתקה ריק או ללא מספר');
    }
  };

  const handlePasteIntoComp = async () => {
    const pasted = await pasteNumberFromClipboard();
    if (pasted) {
      triggerHaptic('solve');
      onPasteParam?.(0, 'comp', pasted);
      showToast(`✓ הודבק: ${pasted}`);
    } else {
      triggerHaptic('del');
      showToast('לוח ההעתקה ריק או ללא מספר');
    }
  };

  // Start long press timer on touch start / mouse down
  const handlePressStart = (e: React.TouchEvent | React.MouseEvent, val: string | number, label: string) => {
    isLongPressTriggeredRef.current = false;
    if ('touches' in e && e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    }

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      handleCopyValue(val, label);
    }, 500);
  };

  // Cancel long press on finger move / scroll
  const handlePressMove = (e: React.TouchEvent | React.MouseEvent) => {
    let currentX = 0;
    let currentY = 0;
    if ('touches' in e && e.touches.length > 0) {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      currentX = e.clientX;
      currentY = e.clientY;
    }

    const deltaX = Math.abs(currentX - touchStartPosRef.current.x);
    const deltaY = Math.abs(currentY - touchStartPosRef.current.y);
    if (deltaX > 8 || deltaY > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  // Handle release: if not long-press, select and enter edit mode
  const handlePressEnd = (index: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isLongPressTriggeredRef.current) {
      playKeyClick('func');
      onSelectParam(index);
    }
    isLongPressTriggeredRef.current = false;
  };

  return (
    <div
      dir="ltr"
      style={{ direction: 'ltr' }}
      className="relative w-full rounded-xl p-2.5 sm:p-3.5 bg-[#92a494] shadow-[inset_0_3px_10px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.5)] border-2 border-[#121413] text-[#142017] font-['Share_Tech_Mono',monospace] select-none flex flex-col h-[320px] sm:h-[350px] overflow-hidden"
    >
      {/* Subtle LCD pixel grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]"
        aria-hidden="true"
      />

      {/* Toast Notification for Clipboard Copy/Paste */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#142017] text-[#92a494] px-3 py-1 rounded-full shadow-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5 animate-bounce">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Indicators Bar (Annunciators) */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#142017]/20 pb-1 mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`px-1 rounded ${isShift ? 'bg-[#142017] text-[#92a494]' : 'text-[#142017]/30'}`}>
            S
          </span>
          <span className={`px-1 rounded ${isAlpha ? 'bg-[#142017] text-[#92a494]' : 'text-[#142017]/30'}`}>
            A
          </span>
          <span className="bg-[#142017] text-[#92a494] px-1.5 py-0.2 rounded font-extrabold text-[10px]">
            {mode}
          </span>
          {mode === 'CMPD' && (
            <span className="font-extrabold text-[#142017] bg-[#142017]/10 px-1 rounded">
              {timing === 'Begin' ? 'BGN' : 'END'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[9.5px]">
          <span className="bg-[#142017]/15 text-[#142017] px-1.5 py-0.5 rounded font-black tracking-tight flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            TOUCH LCD
          </span>
          <span className="text-[#142017] font-bold">DEG</span>
        </div>
      </div>

      {/* Touch Screen Content Area */}
      {mode === 'COMP' ? (
        /* COMP (Standard Calculation) Mode Multi-Line View */
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 flex flex-col justify-between"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {/* History */}
          <div className="space-y-1.5 py-1">
            <div className="text-[10px] text-[#142017]/60 border-b border-[#142017]/15 pb-0.5 flex items-center justify-between">
              <span>היסטוריית חישובים (הקש להעתקת תוצאה)</span>
              <span className="text-[9px]">COMP HISTORY</span>
            </div>
            {compHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#142017]/50 italic">
                אין חישובים קודמים • הקלד ביטוי ולחץ EXE
              </div>
            ) : (
              compHistory.slice(-4).map((h, i) => (
                <div
                  key={i}
                  onClick={() => handleCopyValue(h.result, 'Ans')}
                  className="p-1.5 rounded bg-[#142017]/5 hover:bg-[#142017]/10 border border-[#142017]/10 cursor-pointer flex flex-col items-end transition-colors active:scale-[0.99]"
                >
                  <div className="text-[11px] text-[#142017]/70 font-mono w-full text-left truncate">
                    {h.expr}
                  </div>
                  <div className="text-sm font-bold font-mono text-[#101912] flex items-center gap-1">
                    <span>=</span>
                    <span>{formatCasioLCD(h.result)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Current Calculation Active Line */}
          <div className="border-t-2 border-[#142017]/30 pt-2 pb-1 bg-[#142017]/5 px-2 rounded-lg">
            <div className="text-xs font-semibold text-[#142017]/80 truncate">
              {compExpression || '0'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-right font-mono text-[#101912] mt-0.5 tracking-tight flex items-center justify-end gap-1.5">
              <span>{formatCasioLCD(compResult || '0')}</span>
              <button
                type="button"
                onClick={() => handleCopyValue(compResult || '0', 'Result')}
                className="p-1 text-[#142017]/70 hover:text-[#142017] transition-colors ml-1"
                title="העתק תוצאה ללוח"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handlePasteIntoComp}
                className="p-1 text-[#142017]/70 hover:text-[#142017] transition-colors"
                title="הדבק מספר מהלוח לביטוי"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Financial Parameter List View (CMPD, SMPL, CASH, AMRT, COST, DAYS, etc.) */
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 space-y-1 select-none"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {menuItems.map((item, index) => {
            const isSelected = index === activeIndex;
            const displayValue = isSelected && isEditing ? editValue : String(item.value);

            return (
              <div
                key={item.key}
                onTouchStart={(e) => handlePressStart(e, item.value, item.label)}
                onTouchMove={handlePressMove}
                onTouchEnd={() => handlePressEnd(index)}
                onMouseDown={(e) => handlePressStart(e, item.value, item.label)}
                onMouseMove={handlePressMove}
                onMouseUp={() => handlePressEnd(index)}
                className={`p-2 rounded-lg transition-all duration-150 border flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-[#142017] text-[#92a494] border-[#142017] shadow-md ring-2 ring-[#142017]/30'
                    : 'bg-[#142017]/5 hover:bg-[#142017]/10 text-[#142017] border-[#142017]/15'
                }`}
              >
                {/* Left: Param Label & SOLVE action (shrink-0 ensures labels are never crowded) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 min-w-[36px]">
                    <span className={`font-mono text-sm sm:text-base font-extrabold ${isSelected ? 'text-[#a6baa8]' : 'text-[#101912]'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs opacity-60">=</span>
                  </div>

                  {/* Timing toggle button for Set: END / BGN */}
                  {item.isTiming && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playKeyClick('func');
                        onToggleTiming?.();
                      }}
                      className={`text-[9.5px] px-2 py-0.5 rounded font-black border transition-all ${
                        isSelected
                          ? 'bg-[#92a494] text-[#142017] border-[#92a494]'
                          : 'bg-[#142017]/15 text-[#142017] border-[#142017]/30 hover:bg-[#142017]/25'
                      }`}
                    >
                      {item.value} (שנה)
                    </button>
                  )}

                  {/* SOLVE Touch Button */}
                  {item.canSolve && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playKeyClick('solve');
                        onSolveParam(item.key);
                      }}
                      className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#6ea4d8] text-white hover:bg-[#5b95cd] border border-blue-400'
                          : 'bg-[#6ea4d8]/90 text-white hover:bg-[#5b95cd] border border-blue-400/60'
                      }`}
                      title={`חשב את ערך ${item.label}`}
                    >
                      SOLVE
                    </button>
                  )}
                </div>

                {/* Right: Parameter Value & Actions (Strict 10-digit limit + Copy & Paste buttons) */}
                <div className="flex items-center gap-1.5 font-mono ml-auto">
                  {isSelected ? (
                    /* Active editing state with blinking LCD cursor */
                    <div className="flex items-center bg-[#92a494] text-[#142017] px-2 py-0.5 rounded font-extrabold text-sm sm:text-base tracking-tight shadow-inner">
                      <span>{displayValue || '0'}</span>
                      <span className="inline-block w-2 h-4 sm:h-5 bg-[#142017] ml-0.5 animate-pulse" />
                    </div>
                  ) : (
                    /* Standard displayed value (strictly max 10 digits via formatCasioLCD) */
                    <div className="text-sm sm:text-base font-bold tracking-tight px-1 truncate max-w-[130px] sm:max-w-[150px] text-right">
                      {formatCasioLCD(displayValue)}
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyValue(item.value, item.label);
                    }}
                    className={`p-1 rounded opacity-70 hover:opacity-100 transition-opacity ${
                      isSelected ? 'text-[#92a494] hover:text-white' : 'text-[#142017]'
                    }`}
                    title={`העתק ערך ${item.label} ללוח`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Paste Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePasteIntoParam(index, item.key);
                    }}
                    className={`p-1 rounded opacity-70 hover:opacity-100 transition-opacity ${
                      isSelected ? 'text-[#92a494] hover:text-white' : 'text-[#142017]'
                    }`}
                    title={`הדבק מהלוח ל-${item.label} (PASTE)`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Control Bar: Collapse Screen Back to Normal & Quick Paste */}
      <div className="mt-1.5 pt-1.5 border-t border-[#142017]/20 flex items-center justify-between text-[10px]">
        {/* Quick Paste Button for currently active parameter */}
        <button
          type="button"
          onClick={() => handlePasteIntoParam(activeIndex, menuItems[activeIndex]?.key || '')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#142017]/10 hover:bg-[#142017]/20 text-[#142017] font-bold text-[10px] tracking-wide transition-all border border-[#142017]/30 active:scale-95 shadow-sm"
          title="הדבק מהלוח לפרמטר הפעיל"
        >
          <ClipboardPaste className="w-3 h-3 text-[#142017]" />
          <span>הדבק (PASTE)</span>
        </button>

        <div className="text-[#142017]/70 text-[9px] truncate max-w-[120px] sm:max-w-[150px] hidden sm:block">
          {statusMessage || 'הקש להזנה • החזק להעתקה • הדבק'}
        </div>

        {/* Up arrow collapse button */}
        <button
          type="button"
          onClick={() => {
            playKeyClick('func');
            onCollapse();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#142017] text-[#92a494] hover:bg-black hover:text-white font-bold text-[10px] tracking-wide transition-all shadow active:scale-95 border border-[#142017]/40"
          title="צמצום מסך למצב רגיל"
        >
          <ChevronUp className="w-3 h-3 text-emerald-400" />
          <span>צמצום מסך</span>
        </button>
      </div>
    </div>
  );
};
