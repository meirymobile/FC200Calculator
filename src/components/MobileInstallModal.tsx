import React from 'react';
import { X, Smartphone, Apple, Download, ExternalLink, Check } from 'lucide-react';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">התקנה ב-iPhone, iPad ו-Android APK</h3>
            <p className="text-xs text-zinc-400">גישה ישירה מכל מקום, עבודה באופליין ובמסך מלא</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* iOS Card */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg"></span>
              <h4 className="font-bold text-white text-sm">התקנה במכשירי Apple (iPhone ו-iPad):</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              אפליקציה זו מוגדרת כ-PWA מלא. אין צורך ב-App Store!
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-400">
              <li>פתח את הקישור בדפדפן <strong>Safari</strong> במכשיר.</li>
              <li>לחץ על סמל <strong>השיתוף (Share)</strong> בתחתית Safari.</li>
              <li>בחר <strong>"הוסף למסך הבית" (Add to Home Screen)</strong>.</li>
              <li>לחץ על <strong>הוסף (Add)</strong> בצד ימין למעלה.</li>
            </ol>
            <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
              ✓ האפליקציה תפעל במסך מלא כמו אפליקציה טבעית, ותישמר בזיכרון המכשיר גם ללא אינטרנט.
            </div>
          </div>

          {/* Android Card */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <h4 className="font-bold text-white text-sm">התקנה ב-Android ובניית קובץ APK:</h4>
            </div>
            
            <div className="space-y-2 text-xs text-zinc-300">
              <p>
                <strong>1. התקנה מיידית דרך הדפדפן:</strong><br />
                פתח ב-Chrome, לחץ על שלוש הנקודות בתפריט הדפדפן ובחר <strong>"התקן אפליקציה" (Install App)</strong>.
              </p>
              
              <p>
                <strong>2. הפקת קובץ APK באמצעות Capacitor:</strong><br />
                הפרויקט כולל תשתית Capacitor מלאה. כדי להפיק קובץ APK להתקנה ישירה (Sideload):
              </p>
              <div className="bg-zinc-900 p-2 rounded font-mono text-[11px] text-emerald-400 text-left" dir="ltr">
                npm run build<br />
                npx cap add android<br />
                npx cap open android
              </div>
              <p className="text-[11px] text-zinc-400">
                פקודה זו פותחת את פרויקט האנדרואיד ב-Android Studio, משם ניתן בלחיצה אחת על <em>Build &gt; Build APK</em> לייצר קובץ APK מוכן להתקנה.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow transition-all"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

