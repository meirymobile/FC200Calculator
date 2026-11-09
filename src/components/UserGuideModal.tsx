import React from 'react';
import { X, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">מדריך שימוש במחשבון Casio FC-200V</h3>
            <p className="text-xs text-zinc-400">הוראות הפעלה למצבי החישוב הפיננסיים המרכזיים</p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* Mode CMPD */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <h4 className="font-bold text-blue-400 text-base mb-2">1. מצב CMPD (חישובי ריבית דריבית / TVM)</h4>
            <p className="text-xs text-zinc-300 mb-2">
              משמש לחישוב הלוואות, משכנתאות, חיסכון וצבירה (n, I%, PV, PMT, FV):
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
              <li>השתמש בחצי הניווט הכחולים-אפורים (<strong>▲ ו-▼</strong>) כדי לעבור בין הפרמטרים.</li>
              <li>הקלד מספר ולחץ על <strong>EXE</strong> כדי לאחסן את הערך.</li>
              <li>שים לב: בפיננסים קיים כלל סימני תזרים – סכום שאתה מקבל (כמו הלוואה) הוא חיובי, או שסכום שיוצא מכיסך מסומן במינוס באמצעות מקש <strong>(-)</strong>.</li>
              <li>עמוד על הפרמטר המבוקש (למשל <strong>PMT</strong> לחישוב החזר חודשי) ולחץ על מקש ה-<strong>SOLVE</strong>.</li>
              <li>התוצאה תוצג במסך, ודרך הפתרון המלאה יחד עם לוח הסילוקין יופקו מיד בפאנל הצדדי!</li>
            </ul>
          </div>

          {/* Mode AMORT */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <h4 className="font-bold text-emerald-400 text-base mb-2">2. מצב AMORT (לוח סילוקין)</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
              <li>הגדר את <strong>PM1</strong> (תקופת התחלה) ואת <strong>PM2</strong> (תקופת סיום).</li>
              <li>רד לפרמטר המבוקש (יתרת קרן <strong>BAL</strong>, ריבית בתשלום <strong>INT</strong>, קרן בתשלום <strong>PRN</strong>, סה"כ ריבית <strong>ΣINT</strong> או סה"כ קרן <strong>ΣPRN</strong>).</li>
              <li>לחץ <strong>SOLVE</strong>.</li>
              <li>בלשונית "לוח סילוקין" תוכל לצפות בכל התקופות וללחוץ על <strong>"ייצא לוח סילוקין לאקסל"</strong>.</li>
            </ul>
          </div>

          {/* Mode CASH */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <h4 className="font-bold text-amber-400 text-base mb-2">3. מצב CASH (תזרים מזומנים)</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
              <li>הזן את ריבית ההיוון (<strong>I%</strong>) ואת ההשקעה ההתחלתית השלילית (<strong>CF0</strong>).</li>
              <li>הזן את התזרימים בתקופות הבאות (C1, C2...).</li>
              <li>עמוד על <strong>NPV</strong> או <strong>IRR</strong> או <strong>PBP</strong> ולחץ על <strong>SOLVE</strong>.</li>
            </ul>
          </div>

          {/* Excel Export */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-white text-sm">ייצוא דוחות לאקסל</h5>
              <p className="text-xs text-zinc-400 mt-1">
                כל חישוב שנעשה מפיק קובץ Excel מובנה עם נוסחאות ופורמט מסודר. לחץ על כפתור <strong>"ייצא לאקסל (.xlsx)"</strong> בפאנל הצדדי כדי להוריד את הקובץ ישירות למחשב או לטלפון.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow transition-all"
          >
            הבנתי, סגור מדריך
          </button>
        </div>
      </div>
    </div>
  );
};
