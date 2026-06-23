import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar,
  FileText,
  Clock,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

interface MonthDetailProps {
  monthKey: string; // e.g. "2026-07"
  transactions: Transaction[];
  cashboxTransactions?: any[];
  savingsTransactions?: any[];
  onBack: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  currentYear: number;
}

export default function MonthDetail({
  monthKey,
  transactions,
  cashboxTransactions = [],
  savingsTransactions = [],
  onBack,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  currentYear,
}: MonthDetailProps) {
  
  // States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'debt_receivable' | 'debt_payable'>('expense');
  const [date, setDate] = useState('');
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'debts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const parts = monthKey.split('-');
  const yearStr = parts[0];
  const monthNumStr = parts[1];
  
  // Dynamically calculate the maximum day of the month to prevent browser date constraints bugs
  const maxDayOfChosenMonth = new Date(parseInt(yearStr), parseInt(monthNumStr), 0).getDate();
  const maxDateLimitStr = `${yearStr}-${monthNumStr}-${maxDayOfChosenMonth.toString().padStart(2, '0')}`;

  const monthNamesEnglish: Record<string, string> = {
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

  const monthName = monthNamesEnglish[monthNumStr] || 'Unknown';

  // Set default date upon mount or when editing changes
  useEffect(() => {
    if (!editingId) {
      const today = new Date();
      const currentYearStr = today.getFullYear().toString();
      const currentMonthStr = (today.getMonth() + 1).toString().padStart(2, '0');
      const currentDayStr = today.getDate().toString().padStart(2, '0');
      
      if (monthKey === `${currentYearStr}-${currentMonthStr}`) {
        setDate(`${currentYearStr}-${currentMonthStr}-${currentDayStr}`);
      } else {
        setDate(`${yearStr}-${monthNumStr}-01`);
      }
    }
  }, [monthKey, editingId]);

  // Handle Edit Trigger
  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setText(tx.text);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setDate(tx.date);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText('');
    setAmount('');
    setType('expense');
    
    const today = new Date();
    const currentYearStr = today.getFullYear().toString();
    const currentMonthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    if (monthKey === `${currentYearStr}-${currentMonthStr}`) {
      setDate(`${currentYearStr}-${currentMonthStr}-${today.getDate().toString().padStart(2, '0')}`);
    } else {
      setDate(`${yearStr}-${monthNumStr}-01`);
    }
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const transactionData = {
      text: text.trim(),
      amount: parsedAmount,
      type,
      date: date || `${yearStr}-${monthNumStr}-01`,
    };

    if (editingId) {
      onUpdateTransaction(editingId, transactionData);
    } else {
      onAddTransaction(transactionData);
    }

    // Reset Form
    setText('');
    setAmount('');
    setEditingId(null);
  };

  // Calculations for current month summary dynamically aggregated across Month ledger and Cashbox
  const cashboxTxInMonth = (cashboxTransactions || []).filter(tx => tx.date && tx.date.startsWith(monthKey));

  interface UnifiedTransaction {
    id: string;
    date: string;
    text: string;
    amount: number;
    type: 'income' | 'expense' | 'debt_receivable' | 'debt_payable' | 'cashbox_deposit' | 'cashbox_withdrawal';
    createdAt: string;
    settled?: boolean;
    source: 'month' | 'cashbox';
    sourceLabel: string;
    sourceColorClass: string;
  }

  const unifiedTransactions: UnifiedTransaction[] = [
    ...transactions.map(t => ({
      ...t,
      source: 'month' as const,
      sourceLabel: 'الشهري / Monthly',
      sourceColorClass: 'bg-neutral-100 text-neutral-800 border-neutral-200'
    })),
    ...cashboxTxInMonth.map(ct => ({
      id: ct.id,
      date: ct.date,
      text: ct.text,
      amount: ct.amount,
      type: (ct.type === 'income' ? 'cashbox_deposit' : 'cashbox_withdrawal') as any,
      createdAt: ct.createdAt,
      source: 'cashbox' as const,
      sourceLabel: 'الصندوق / Cashbox',
      sourceColorClass: 'bg-amber-50 text-amber-805 border-amber-200'
    }))
  ];

  let monthIncome = 0;
  let monthExpense = 0;
  let monthDebtReceivable = 0;
  let monthDebtPayable = 0;

  unifiedTransactions.forEach(t => {
    if (t.type === 'income' || t.type === 'cashbox_deposit') {
      monthIncome += t.amount;
    } else if (t.type === 'expense' || t.type === 'cashbox_withdrawal') {
      monthExpense += t.amount;
    } else if (t.type === 'debt_receivable') {
      monthDebtReceivable += t.amount;
    } else if (t.type === 'debt_payable') {
      monthDebtPayable += t.amount;
    }
  });

  const monthNet = monthIncome - monthExpense;
  const monthDebtsNet = monthDebtReceivable - monthDebtPayable;
  const monthTotalWithDebts = monthNet + monthDebtsNet;

  // Filter & Search transactions
  const filteredTransactions = unifiedTransactions
    .filter(t => {
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (activeFilter === 'income') {
        return t.type === 'income' || t.type === 'cashbox_deposit';
      }
      if (activeFilter === 'expense') {
        return t.type === 'expense' || t.type === 'cashbox_withdrawal';
      }
      if (activeFilter === 'debts') return t.type === 'debt_receivable' || t.type === 'debt_payable';
      return true; // 'all'
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });

  // Simple formatter for time display of inputs
  const formatDateTimeStamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-JO', {
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="month-detail-view">
      
      {/* Top sticky bar in charcoal and gold */}
      <div className="bg-[#1c1c1c] text-white py-5 px-4 sticky top-0 z-40 shadow-md border-b-2 border-[#d4af37]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-355 hover:text-white transition-all cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-[#d4af37]/35 py-1.5 px-3 rounded-lg text-xs font-bold"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-bold text-neutral-400">Monthly Budget Statement</h1>
            <p className="text-base font-black text-[#d4af37] mt-0.5">
              {monthNumStr}/{yearStr} {monthName}
            </p>
          </div>

          <div className="w-16"></div> {/* Spacer for symmetry */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* Current Month Financial Board */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-4" id="month-stat-deck">
          <div className="border-r-2 border-[#d4af37]/40 pr-3">
            <span className="text-[11px] text-neutral-400 font-bold">إيراد الشهر</span>
            <div className="text-lg font-bold text-[#c29e2f] font-mono mt-1">
              +{formatNumber(monthIncome)}
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">مكتسبات مستلمة</p>
          </div>

          <div className="border-r-2 border-slate-200 pr-3">
            <span className="text-[11px] text-neutral-400 font-bold">مصاريف الشهر</span>
            <div className="text-lg font-bold text-rose-600 font-mono mt-1">
              -{formatNumber(monthExpense)}
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">فواتير ومشتريات</p>
          </div>

          <div className="border-r-2 border-[#d4af37]/40 pr-3">
            <span className="text-[11px] text-neutral-400 font-bold font-sans">صافي الشهر (دون ديون)</span>
            <div className={`text-lg font-bold font-mono mt-1 ${monthNet >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatCurrency(monthNet)}
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">الرصيد المحلّي الفعلي</p>
          </div>

          <div className="border-r-2 border-neutral-300 pr-3">
            <span className="text-[11px] text-neutral-400 font-bold">الملاك الشامل (مع الديون)</span>
            <div className={`text-lg font-bold font-mono mt-1 ${monthTotalWithDebts >= 0 ? 'text-[#1c1c1c]' : 'text-rose-650'}`}>
              {monthTotalWithDebts !== monthNet ? formatCurrency(monthTotalWithDebts) : 'ـ'}
            </div>
            <p className="text-[9px] text-neutral-400 mt-0.5">
              {monthDebtsNet > 0 
                ? `ديون لك بـ ${formatNumber(monthDebtReceivable)}` 
                : monthDebtPayable > 0 
                ? `ديون عليك بـ ${formatNumber(monthDebtPayable)}` 
                : 'لا توجد ديون هذا الشهر'
              }
            </p>
          </div>
        </div>

        {/* Form Grid & Input */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add / Edit Form Column */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm sticky top-24" id="transaction-add-form">
              <h2 className="text-sm font-bold text-[#1c1c1c] mb-4 flex items-center gap-2 border-b border-neutral-150 pb-2">
                <Plus size={16} className="text-[#d4af37]" />
                {editingId ? 'Edit Entry Record' : 'Add Monthly Budget Input'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Amount</label>
                  <div className="relative">
                    <input
                      id="amount-field"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2.5 pl-12 pr-4 text-left font-mono text-base font-bold focus:outline-none transition-all"
                    />
                    <div className="absolute left-3 top-2.5 text-xs text-[#d4af37] font-bold select-none">
                      JOD
                    </div>
                  </div>
                </div>

                {/* Text Description field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Statement Label (Description)</label>
                  <input
                    id="text-field"
                    type="text"
                    required
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="e.g. Rent, Salary, Bill, Grocery..."
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none transition-all"
                  />
                </div>

                {/* Entry custom Selection Date */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-sans">Select Date</label>
                  <input
                    id="date-field"
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={`${yearStr}-${monthNumStr}-01`}
                    max={maxDateLimitStr}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2 px-4 text-xs font-mono font-medium focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Must reside within selected calendar month {monthNumStr}/{yearStr}</p>
                </div>

                {/* Type selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2">Category Flow Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        type === 'income'
                          ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#1c1c1c] shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <TrendingUp size={14} className="text-[#d4af37]" />
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        type === 'expense'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <TrendingDown size={14} />
                      Expense
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setType('debt_receivable')}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        type === 'debt_receivable'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <Scale size={13} />
                      Owed To Us
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('debt_payable')}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        type === 'debt_payable'
                          ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <Scale size={13} />
                      We Owe
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    id="submit-transaction-btn"
                    type="submit"
                    className="flex-1 bg-[#1c1c1c] text-[#d4af37] border border-[#d4af37]/30 hover:bg-neutral-800 font-bold py-2.5 rounded-lg shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {editingId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editingId ? 'Save Changes' : 'Insert Record'}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-2.5 px-3 rounded-lg transition-all text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Transaction Ledger Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Type Filters tabs */}
              <div className="flex bg-neutral-100 p-1 rounded-lg w-full md:w-auto border border-neutral-150">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'all' ? 'bg-[#1c1c1c] text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('income')}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'income' ? 'bg-[#d4af37] text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('expense')}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-500 hover:text-[#1c1c1c]'
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('debts')}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'debts' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Debts
                </button>
              </div>

              {/* Text Search Input */}
              <div className="w-full md:w-48 relative">
                <input
                  id="search-transactions"
                  type="text"
                  placeholder="Seach statements..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-55 border border-neutral-200 focus:border-[#d4af37] rounded-lg py-1.5 px-3 text-xs font-medium focus:outline-none text-left"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Transaction ListView */}
            <div className="space-y-3" id="transactions-list-container">
              {filteredTransactions.length === 0 ? (
                <div className="bg-white rounded-xl py-12 px-6 border border-neutral-200 text-center text-neutral-400 space-y-2 shadow-inner">
                  <FileText size={36} className="mx-auto text-[#d4af37]/60" />
                  <p className="text-sm font-bold text-neutral-600">No matching financial entries found.</p>
                  <p className="text-xs">Log your first budget items to monitor this month's stats.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map(tx => {
                    let typeBadgeText = 'Income';
                    let typeBadgeClass = 'bg-[#d4af37]/10 text-[#c29e2f] border-[#d4af37]/25';
                    let amountSign = '+';
                    let amountClass = 'text-[#c29e2f]';

                    if (tx.type === 'expense' || tx.type === 'cashbox_withdrawal') {
                      typeBadgeText = tx.type === 'cashbox_withdrawal' 
                        ? 'Cashbox Out' 
                        : 'Expense';
                      typeBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                      amountSign = '-';
                      amountClass = 'text-rose-600';
                    } else if (tx.type === 'income' || tx.type === 'cashbox_deposit') {
                      typeBadgeText = tx.type === 'cashbox_deposit' 
                        ? 'Cashbox In' 
                        : 'Income';
                      typeBadgeClass = 'bg-[#d4af37]/10 text-[#c29e2f] border-[#d4af37]/25';
                      amountSign = '+';
                      amountClass = 'text-[#c29e2f]';
                    } else if (tx.type === 'debt_receivable') {
                      typeBadgeText = 'Owed to us';
                      typeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                      amountSign = '•';
                      amountClass = 'text-blue-600';
                    } else if (tx.type === 'debt_payable') {
                      typeBadgeText = 'We owe';
                      typeBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                      amountSign = '•';
                      amountClass = 'text-purple-600';
                    }

                    const displayDay = tx.date.split('-')[2] || '01';
                    const isReadOnly = tx.source !== 'month';

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={tx.id}
                        className={`bg-white rounded-xl p-4.5 border border-neutral-200 flex items-center justify-between hover:shadow-2xs transition-all ${
                          editingId === tx.id ? 'ring-2 ring-[#d4af37] border-transparent' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-neutral-50 text-neutral-500 border border-neutral-200 font-mono font-bold rounded-lg text-center w-11 py-1.5 leading-none shrink-0 flex flex-col justify-center items-center">
                            <span className="text-xs">{displayDay}</span>
                            <span className="text-[8px] uppercase mt-0.5">{monthNumStr}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#1c1c1c] text-sm leading-tight text-left">
                                {tx.text}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadgeClass}`}>
                                {typeBadgeText}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tx.sourceColorClass}`}>
                                {tx.sourceLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-3.5 text-neutral-400 text-[10px] sm:text-xs">
                              <div className="flex items-center gap-1">
                                <Clock size={11} className="shrink-0 text-[#d4af37]" />
                                <span>Logged at: {formatDateTimeStamp(tx.createdAt)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1 font-mono">
                                <Calendar size={11} className="shrink-0" />
                                <span>{tx.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left">
                            <span className={`font-mono text-base font-extrabold ${amountClass}`}>
                              {amountSign}{formatNumber(tx.amount)}
                            </span>
                            <p className="text-[10px] text-neutral-400">JOD</p>
                          </div>

                          <div className="flex items-center gap-1 border-r border-neutral-150 pr-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (isReadOnly) {
                                  alert('هذا المدخل تم تسجيله بشكل مباشر من الصندوق أو الحصالة. لتعديله أو حذفه، تفضل بالانتقال للقسم المخصص له في الصفحة الرئيسية.');
                                  return;
                                }
                                handleStartEdit(tx as any);
                              }}
                              className={`p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-neutral-50 rounded-lg transition-all cursor-pointer ${
                                isReadOnly ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title={isReadOnly ? 'Add-on Transaction (Direct entry)' : 'Edit Item'}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isReadOnly) {
                                  alert('هذا المدخل تم تسجيله بشكل مباشر من الصندوق أو الحصالة. لتعديله أو حذفه، تفضل بالانتقال للقسم المخصص له في الصفحة الرئيسية.');
                                  return;
                                }
                                if (window.confirm('Are you sure you want to delete this financial entry?')) {
                                  onDeleteTransaction(tx.id);
                                  if (editingId === tx.id) {
                                    handleCancelEdit();
                                  }
                                }
                              }}
                              className={`p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ${
                                isReadOnly ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title={isReadOnly ? 'Add-on Transaction (Direct entry)' : 'Delete Item'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
