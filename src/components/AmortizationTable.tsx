import React, { useState } from 'react';
import { AmortizationSummary, TVMParams } from '../types/calculator';
import { exportAmortizationToExcel } from '../services/excelService';
import { FileSpreadsheet, Search, ArrowUpDown, Download } from 'lucide-react';

interface AmortizationTableProps {
  summary: AmortizationSummary | null;
  params: TVMParams;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  summary,
  params,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(24); // 2 years default or all
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (!summary || summary.rows.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400 bg-zinc-900/50 rounded-2xl border border-zinc-800">
        לא הופק לוח סילוקין. בצע חישוב במצב CMPD או AMORT במחשבון.
      </div>
    );
  }

  const filteredRows = summary.rows.filter(
    (r) =>
      searchTerm === '' ||
      r.period.toString().includes(searchTerm) ||
      r.payment.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const displayedRows =
    pageSize === -1
      ? filteredRows
      : filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPaid = summary.rows.reduce((acc, r) => acc + r.payment, 0);
  const totalInterest = summary.rows.reduce((acc, r) => acc + r.interest, 0);
  const loanAmount = Math.abs(params.pv);

  const handleExportExcel = () => {
    exportAmortizationToExcel(params, summary.rows);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="text-xs text-zinc-400">סכום הלוואה (PV)</div>
          <div className="text-base sm:text-lg font-bold text-white">
            {loanAmount.toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪
          </div>
        </div>

        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="text-xs text-zinc-400">תשלום חודשי (PMT)</div>
          <div className="text-base sm:text-lg font-bold text-blue-400">
            {Math.abs(params.pmt).toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪
          </div>
        </div>

        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="text-xs text-zinc-400">סך ריבית כוללת</div>
          <div className="text-base sm:text-lg font-bold text-amber-400">
            {totalInterest.toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪
          </div>
        </div>

        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
          <div className="text-xs text-zinc-400">סך החזר כולל</div>
          <div className="text-base sm:text-lg font-bold text-emerald-400">
            {totalPaid.toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪
          </div>
        </div>
      </div>

      {/* Top Action Bar: Search, Page Size, Excel Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="חפש לפי תקופה..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 text-white text-xs rounded-lg pr-9 pl-3 py-2 border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-zinc-950 text-zinc-300 text-xs rounded-lg px-2.5 py-2 border border-zinc-700"
          >
            <option value={12}>12 תשלומים</option>
            <option value={24}>24 תשלומים</option>
            <option value={60}>60 תשלומים</option>
            <option value={-1}>כל התשלומים ({summary.rows.length})</option>
          </select>
        </div>

        {/* The prominent Excel Export button */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-md transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ייצא לוח סילוקין לאקסל (.xlsx)</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 max-h-[500px] overflow-y-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 sticky top-0 z-10 border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-3">תקופה</th>
              <th className="py-2.5 px-3">תשלום (₪)</th>
              <th className="py-2.5 px-3">החזר קרן (₪)</th>
              <th className="py-2.5 px-3">תשלום ריבית (₪)</th>
              <th className="py-2.5 px-3">יתרת קרן (₪)</th>
              <th className="py-2.5 px-3">קרן מצטברת (₪)</th>
              <th className="py-2.5 px-3">ריבית מצטברת (₪)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
            {displayedRows.map((row) => (
              <tr key={row.period} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-2 px-3 font-semibold text-zinc-400">{row.period}</td>
                <td className="py-2 px-3 font-mono font-medium text-blue-300">
                  {row.payment.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 font-mono text-emerald-400">
                  {row.principal.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 font-mono text-amber-400">
                  {row.interest.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 font-mono text-white font-semibold">
                  {row.balance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 font-mono text-zinc-400">
                  {row.accumulatedPrincipal.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 font-mono text-zinc-400">
                  {row.accumulatedInterest.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
          <div>
            עמוד {currentPage} מתוך {totalPages} (סה"כ {filteredRows.length} תשלומים)
          </div>
          <div className="flex gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white"
            >
              הקודם
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
