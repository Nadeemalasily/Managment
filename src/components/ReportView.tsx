import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Calendar, 
  User 
} from 'lucide-react';
import { AppData, Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

interface ReportViewProps {
  appData: AppData;
  onBack: () => void;
}

export default function ReportView({ appData, onBack }: ReportViewProps) {
  // Aggregate Metrics
  let annualIncome = 0;
  let annualExpense = 0;
  let totalDebtsReceivable = 0;
  let totalDebtsPayable = 0;

  const allMonthlyTransactions: { monthKey: string; name: string; items: Transaction[] }[] = [];
  const monthNamesEnglishShort: Record<string, string> = {
    '01': 'JAN',
    '02': 'FEB',
    '03': 'MAR',
    '04': 'APR',
    '05': 'MAY',
    '06': 'JUN',
    '07': 'JUL',
    '08': 'AUG',
    '09': 'SEP',
    '10': 'OCT',
    '11': 'NOV',
    '12': 'DEC',
  };

  // Process and sort months
  Object.keys(appData?.months || {})
    .sort()
    .forEach(monthKey => {
      const parts = monthKey.split('-');
      const year = parts[0];
      const monthNum = parts[1];
      const items = (appData?.months || {})[monthKey] || [];
      
      items.forEach(t => {
        if (t.type === 'income') annualIncome += t.amount;
        else if (t.type === 'expense') annualExpense += t.amount;
        else if (t.type === 'debt_receivable') {
          if (!t.settled) totalDebtsReceivable += t.amount;
        }
        else if (t.type === 'debt_payable') {
          if (!t.settled) totalDebtsPayable += t.amount;
        }
      });

      const mShort = monthNamesEnglishShort[monthNum] || '';
      allMonthlyTransactions.push({
        monthKey,
        name: `${monthNum}/${year} ${mShort}`,
        items,
      });
    });

  const balanceExclDebts = annualIncome - annualExpense;

  let directDeposits = 0;
  let directWithdrawals = 0;
  (appData?.cashboxTransactions || []).forEach(ct => {
    if (ct.type === 'income') directDeposits += ct.amount;
    else directWithdrawals += ct.amount;
  });

  const directNetSum = directDeposits - directWithdrawals;
  const overallCashboxBalance = balanceExclDebts + directNetSum;

  let totalSaved = 0;
  let savingsCustomDeposits = 0;
  let savingsCustomWithdrawals = 0;
  (appData.savingsTransactions || []).forEach(st => {
    if (st.type === 'deposit') {
      savingsCustomDeposits += st.amount;
    } else {
      savingsCustomWithdrawals += st.amount;
    }
  });
  totalSaved = savingsCustomDeposits - savingsCustomWithdrawals;

  const totalOverallIncome = annualIncome + directDeposits;
  const totalOverallExpense = annualExpense + directWithdrawals;
  const totalLiquidAssets = overallCashboxBalance;
  const totalOverallWithDebts = totalLiquidAssets + totalDebtsReceivable - totalDebtsPayable;

  const handlePrint = () => {
    window.print();
  };

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('en-JO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-20 font-sans" id="annual-report-screen">
      
      {/* Top action bar: hidden during print */}
      <div className="bg-[#1c1c1c] text-white py-4 px-4 sticky top-0 z-40 shadow-md border-b-2 border-[#d4af37] no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-350 hover:text-white transition-all cursor-pointer bg-neutral-900 border border-neutral-850 hover:border-[#d4af37]/40 py-2 px-3.5 rounded-lg text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-sm font-bold text-[#d4af37]">Export Account Statement Report</span>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#d4af37] hover:bg-[#c29e2f] text-[#1c1c1c] font-black py-2 px-4 rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer border border-[#d4af37]/30"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Sheet with fine double border styling */}
      <div className="max-w-4xl mx-auto bg-white my-6 p-8 rounded-xl border-2 border-[#d4af37]/40 shadow-xl print:shadow-none print:border-none print:my-0 print:p-0" id="print-sheet">
        
        {/* Report Official Certificate Header */}
        <div className="border-b-2 border-[#1c1c1c] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#d4af37] font-mono tracking-widest uppercase block">
              MONTH MANAGEMENT SYSTEM • {appData.currentYear}
            </span>
            <h1 className="text-xl font-black text-[#1c1c1c] tracking-tight">
              Statement of Account & Final Report for Financial Year {appData.currentYear}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <User size={14} className="text-[#d4af37]" />
                Account Owner: <strong className="text-neutral-850">Nadeem</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-[#d4af37]" />
                Accounting Period Scope: <strong>01/01/{appData.currentYear} to 12/31/{appData.currentYear}</strong>
              </span>
            </div>
          </div>

          <div className="bg-[#fdfdfb] p-3.5 rounded-lg border border-[#d4af37]/25 text-left shrink-0">
            <p className="text-[9px] text-neutral-400 font-bold">Issue Date of Final Statement</p>
            <p className="font-bold text-xs text-[#1c1c1c] mt-0.5">{getTodayFormatted()}</p>
            <p className="text-[8px] text-[#c29e2f] mt-1 font-mono tracking-wider font-bold">STATUS: CONFIDENTIAL • PERSONAL ONLY</p>
          </div>
        </div>

        {/* Executive Summary stats deck */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4 border-l-2 border-[#d4af37] pl-2">
            I. Executive Summary & Overall Balances
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-[#fdfdfb] rounded-lg p-4 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 font-bold">Total Receipts (Income)</p>
              <p className="text-lg font-bold font-mono text-[#c29e2f] mt-1">
                {formatCurrency(totalOverallIncome)}
              </p>
            </div>

            <div className="bg-[#fdfdfb] rounded-lg p-4 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 font-bold font-sans">Total Payments (Expenses)</p>
              <p className="text-lg font-bold font-mono text-rose-650 mt-1">
                {formatCurrency(totalOverallExpense)}
              </p>
            </div>

            <div className="bg-[#1c1c1c] rounded-lg p-4 border border-[#d4af37]/30 text-white">
              <p className="text-[10px] text-neutral-350 font-bold">Total Comprehensive Box Balance</p>
              <p className="text-lg font-bold font-mono text-[#d4af37] mt-1">
                {formatCurrency(overallCashboxBalance)}
              </p>
            </div>

            <div className="bg-[#fdfdfb] rounded-lg p-4 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 font-bold font-sans">Net Liquid Balance (Excl. Debts)</p>
              <p className="text-base font-bold font-mono text-neutral-800 mt-1">
                {formatCurrency(totalLiquidAssets)}
              </p>
            </div>

            <div className="bg-[#fdfdfb] rounded-lg p-4 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 font-bold font-sans">Current Balance (With Active Debts)</p>
              <p className="text-base font-bold font-mono text-neutral-800 mt-1">
                {formatCurrency(totalOverallWithDebts)}
              </p>
            </div>

            <div className="bg-[#fdfdfb] rounded-lg p-4 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 font-bold font-sans">Outstanding Debts & Liabilities</p>
              <p className="text-xs font-bold text-[#c29e2f] mt-1.5 leading-tight">
                Receivables (Owed to Us): {formatNumber(totalDebtsReceivable)} JOD | Payables (We Owe): {formatNumber(totalDebtsPayable)} JOD
              </p>
            </div>

            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-600 font-bold font-sans">Accumulated Vault Savings</p>
              <p className="text-base font-bold font-mono text-emerald-600 mt-1">
                {formatCurrency(totalSaved)}
              </p>
            </div>

          </div>
        </div>

        {/* Detailed months breakdowns with page-breaks support */}
        <div className="mt-10 space-y-8">
          <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider pb-2 border-b border-neutral-200 border-l-2 border-[#d4af37] pl-2">
            II. Detailed Breakdowns of Individual Months for {appData.currentYear}
          </h2>

          {allMonthlyTransactions.map((m, mIdx) => {
            const hasData = m.items.length > 0;
            
            // Calculate monthly sums
            let mInc = 0;
            let mExp = 0;
            let mDr = 0;
            let mDp = 0;
            
            m.items.forEach(t => {
              if (t.type === 'income') mInc += t.amount;
              else if (t.type === 'expense') mExp += t.amount;
              else if (t.type === 'debt_receivable') mDr += t.amount;
              else if (t.type === 'debt_payable') mDp += t.amount;
            });

            return (
              <div key={m.monthKey} className="space-y-2.5 break-inside-avoid pt-2">
                <div className="flex justify-between items-center bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200 flex-wrap gap-2">
                  <h3 className="font-bold text-[#1c1c1c] text-xs">
                    {mIdx + 1}- Month Budget Details for {m.monthKey.split('-')[1]} ({m.name})
                  </h3>
                  <div className="flex gap-3 text-[9px] font-mono font-bold text-neutral-500">
                    <span>In: {formatNumber(mInc)}</span>
                    <span>Out: {formatNumber(mExp)}</span>
                    <span>Debts: +(Owed to me {formatNumber(mDr)}) | -(We owe {formatNumber(mDp)})</span>
                    <span className="text-[#c29e2f]">Net: {formatNumber(mInc - mExp)} JOD</span>
                  </div>
                </div>

                {!hasData ? (
                  <p className="text-[10px] text-neutral-400 pl-4 italic py-1 text-left">There are no budget transactions logged for this month.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-150 text-neutral-400 font-bold">
                          <th className="pb-1.5 w-24">Transaction Date</th>
                          <th className="pb-1.5">Statement Description / Label</th>
                          <th className="pb-1.5 w-28">Financial Type</th>
                          <th className="pb-1.5 text-right w-32">Operation Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {m.items.map(t => {
                          let typeEnglish = 'Income';
                          let amountPrefix = '+';
                          let typeClass = 'text-[#c29e2f]';

                          if (t.type === 'expense') {
                             typeEnglish = 'Expense';
                             amountPrefix = '-';
                             typeClass = 'text-rose-600';
                          } else if (t.type === 'debt_receivable') {
                            typeEnglish = 'Owed To Us';
                            amountPrefix = 'Owed';
                            typeClass = 'text-blue-600';
                          } else if (t.type === 'debt_payable') {
                            typeEnglish = 'We Owe';
                            amountPrefix = 'We Owe';
                            typeClass = 'text-purple-600';
                          }

                          return (
                            <tr key={t.id} className="hover:bg-neutral-50/50">
                              <td className="py-1.5 font-mono text-neutral-400">{t.date}</td>
                              <td className="py-1.5 font-bold text-[#1c1c1c]">{t.text}</td>
                              <td className="py-1.5 text-neutral-500">{typeEnglish}</td>
                              <td className={`py-1.5 text-right font-mono font-bold ${typeClass}`}>
                                {amountPrefix} {formatNumber(t.amount)} JOD
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cashbox manual direct ledger */}
        <div className="mt-10 break-inside-avoid text-left">
          <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider pb-2 border-b border-neutral-200 mb-4 border-l-2 border-[#d4af37] pl-2">
            III. Direct Box Ledger (Standalone Transactions)
          </h2>

          {appData.cashboxTransactions.length === 0 ? (
            <p className="text-[10px] text-neutral-400 italic">No direct ledger transactions logged in the primary cashbox.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-150 text-neutral-400 font-bold">
                    <th className="pb-2 w-28">Date</th>
                    <th className="pb-2">Statement Reason / Description</th>
                    <th className="pb-2 w-28">Direct Type</th>
                    <th className="pb-2 text-right w-32">Cash Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {appData.cashboxTransactions.map(ct => (
                    <tr key={ct.id}>
                      <td className="py-2 font-mono text-neutral-400">{ct.date}</td>
                      <td className="py-2 font-bold text-[#1c1c1c]">{ct.text}</td>
                      <td className="py-2 text-neutral-500">{ct.type === 'income' ? 'Direct Deposit' : 'Direct Withdrawal'}</td>
                      <td className={`py-2 text-right font-mono font-extrabold ${ct.type === 'income' ? 'text-[#c29e2f]' : 'text-rose-600'}`}>
                        {ct.type === 'income' ? '+' : '-'} {formatNumber(ct.amount)} JOD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures of certified audit */}
        <div className="mt-16 pt-8 border-t-2 border-[#1c1c1c] text-center text-xs text-neutral-400 grid grid-cols-2 gap-8 break-inside-avoid font-sans">
          <div>
            <p className="font-bold text-neutral-500">Personal Budget Owner Endorsement</p>
            <div className="h-16 flex items-end justify-center">
              <span className="font-mono text-[#1c1c1c] tracking-wider font-extrabold italic text-sm border-b border-neutral-300 px-6 pb-1">
                Nadeem
              </span>
            </div>
          </div>
          <div>
            <p className="font-bold text-neutral-500">Matured Automated System Audit</p>
            <div className="h-16 flex items-end justify-center">
              <span className="font-mono text-[#c29e2f] font-bold italic text-[11px] border-b border-neutral-200 px-4 pb-1">
                Month Management System (2026)
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-neutral-400 no-print">
        <p>Note: To save this report digitally as a PDF, select "Save as PDF" from your printer destination settings.</p>
      </div>

    </div>
  );
}
