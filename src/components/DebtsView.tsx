import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { 
  ArrowLeft, 
  Scale, 
  Plus, 
  CheckCircle, 
  X, 
  Calendar, 
  Search, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Clock,
  User,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../utils/storage';

interface DebtsViewProps {
  appData: AppData;
  onBack: () => void;
  onAddDebt: (monthKey: string, transaction: Omit<Transaction, 'id' | 'createdAt' | 'settled' | 'settledAt'>) => void;
  onToggleSettleDebt: (monthKey: string, id: string) => void;
  onDeleteDebt: (monthKey: string, id: string) => void;
}

export default function DebtsView({
  appData,
  onBack,
  onAddDebt,
  onToggleSettleDebt,
  onDeleteDebt,
}: DebtsViewProps) {
  
  // Local form states
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debt_receivable' | 'debt_payable'>('debt_receivable');
  
  const today = new Date();
  const currentYearStr = appData.currentYear.toString();
  const currentMonthStr = (today.getMonth() + 1).toString().padStart(2, '0');
  const [monthKey, setMonthKey] = useState(`${currentYearStr}-${currentMonthStr}`);
  
  const [date, setDate] = useState(() => {
    const todayStr = today.getDate().toString().padStart(2, '0');
    return `${currentYearStr}-${currentMonthStr}-${todayStr}`;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'outstanding' | 'settled' | 'receivable' | 'payable'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all debts from months structure
  const allDebts: { monthKey: string; tx: Transaction }[] = [];
  Object.entries(appData?.months || {}).forEach(([mKey, transactions]) => {
    (transactions || []).forEach(t => {
      if (t.type === 'debt_receivable' || t.type === 'debt_payable') {
        allDebts.push({ monthKey: mKey, tx: t });
      }
    });
  });

  // Calculate totals
  let outstandingOwedToUs = 0; // Receivable & NOT settled
  let outstandingWeOwe = 0;    // Payable & NOT settled
  let settledOwedToUs = 0;      // Receivable & settled
  let settledWeOwe = 0;        // Payable & settled

  allDebts.forEach(({ tx }) => {
    const amt = tx.amount;
    if (tx.type === 'debt_receivable') {
      if (tx.settled) {
        settledOwedToUs += amt;
      } else {
        outstandingOwedToUs += amt;
      }
    } else {
      if (tx.settled) {
        settledWeOwe += amt;
      } else {
        outstandingWeOwe += amt;
      }
    }
  });

  const netActiveDebt = outstandingOwedToUs - outstandingWeOwe;

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Build model
    const newDebtData = {
      text: text.trim(),
      amount: parsedAmount,
      type,
      date,
    };

    onAddDebt(monthKey, newDebtData);

    // Reset Form
    setText('');
    setAmount('');
  };

  // Month Key Option dropdown List
  const monthNamesShort: Record<string, string> = {
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

  const monthKeysList = Object.keys(appData?.months || {}).sort();

  // Filter and search lists
  const filteredDebts = allDebts
    .filter(({ tx }) => {
      // Search text matches
      if (searchQuery && !tx.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter state matches
      if (activeFilter === 'outstanding') return !tx.settled;
      if (activeFilter === 'settled') return !!tx.settled;
      if (activeFilter === 'receivable') return tx.type === 'debt_receivable';
      if (activeFilter === 'payable') return tx.type === 'debt_payable';
      return true;
    })
    .sort((a, b) => b.tx.date.localeCompare(a.tx.date) || b.tx.createdAt.localeCompare(a.tx.createdAt));

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-JO', {
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="debts-tracker-view">
      
      {/* Top sticky bar */}
      <div className="bg-[#1c1c1c] text-white py-5 px-4 sticky top-0 z-40 shadow-md border-b-2 border-[#d4af37]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-all cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-[#d4af37]/35 py-1.5 px-3 rounded-lg text-xs font-bold"
            id="debts-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-bold text-neutral-400">Debts & Obligations Registry</h1>
            <p className="text-base font-black text-[#d4af37] mt-0.5 flex items-center justify-center gap-2">
              <Scale size={18} />
              <span>دفتر تتبع الديون والالتزامات المالية</span>
            </p>
          </div>

          <div className="w-16"></div> {/* spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* Dynamic Debt Counters Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="debts-aggregate-summary-deck">
          {/* Card 1: Debts owed TO us (لنا) */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-neutral-500 font-bold block">ديون مستحقة لنا</span>
                <span className="text-[10px] text-neutral-400 font-sans">Owed TO Us</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold font-mono text-blue-600 tracking-tight">
                {formatCurrency(outstandingOwedToUs)}
              </span>
              <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
                <span>المسددة سابقاً:</span>
                <span className="font-mono font-semibold text-neutral-500">+{formatNumber(settledOwedToUs)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Debts we owe to others (علينا) */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-purple-500 hover:shadow-lg transition-all flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-neutral-500 font-bold block">ديون مطلوبة منا</span>
                <span className="text-[10px] text-neutral-400 font-sans">Owed BY Us (Obligations)</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold font-mono text-purple-600 tracking-tight">
                {formatCurrency(outstandingWeOwe)}
              </span>
              <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
                <span>المسددة سابقاً:</span>
                <span className="font-mono font-semibold text-neutral-500">-{formatNumber(settledWeOwe)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Net Debt Exposure */}
          <div className="bg-[#1c1c1c] text-white p-5 rounded-xl shadow-md border-t-4 border-[#d4af37] hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#d4af37]"></div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-[#d4af37] font-bold block">رصيد المديونية الصافي</span>
                <span className="text-[10px] text-neutral-400 font-sans">Net Active Debt Balance</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center border border-[#d4af37]/25">
                <Scale size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${netActiveDebt >= 0 ? 'text-[#d4af37]' : 'text-rose-400'}`}>
                {netActiveDebt >= 0 ? `+${formatCurrency(netActiveDebt)}` : formatCurrency(netActiveDebt)}
              </span>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                {netActiveDebt >= 0 ? 'رصيد إيجابي لصالحك' : 'مطلوبات يتوجب سدادها'}
              </p>
            </div>
          </div>
        </div>

        {/* Form and ledger workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Add New Debt card: Forms (col: 4) */}
          <div className="lg:col-span-4" id="add-debt-form-pane">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-2">
                <Plus size={16} className="text-[#d4af37]" />
                <span>إضافة دين جديد / Add Debt</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Flow type selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">طبيعة الدين / Debt Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('debt_receivable')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        type === 'debt_receivable'
                          ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs ring-2 ring-blue-500/15'
                          : 'bg-white border-neutral-200 text-neutral-500'
                      }`}
                    >
                      <TrendingUp size={14} className="text-blue-600" />
                      <span>دين لنا (مستحق)</span>
                      <span className="text-[8px] opacity-70 font-sans">Owed To Us</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('debt_payable')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        type === 'debt_payable'
                          ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs ring-2 ring-purple-500/15'
                          : 'bg-white border-neutral-200 text-neutral-500'
                      }`}
                    >
                      <TrendingDown size={14} className="text-purple-600" />
                      <span>دين علينا (مطلوب)</span>
                      <span className="text-[8px] opacity-70 font-sans">Owed By Us</span>
                    </button>
                  </div>
                </div>

                {/* Amount in JOD */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">المبلغ المالي / Amount</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2 pl-4 pr-12 text-sm font-mono font-bold focus:outline-none text-left"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-neutral-400 font-mono select-none">JOD</span>
                  </div>
                </div>

                {/* Description Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">تفاصيل الدين (الجهة والسبب) / Statement</label>
                  <input
                    required
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="مثل: سلفة أحمد، قسط السيارة..."
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2.5 px-3 text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">تاريخ العملية / Value Date</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] rounded-lg py-2 px-3 text-xs font-mono focus:outline-none"
                  />
                </div>

                {/* Associated Month selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">تنسيب تحت كشف شهر / File in statement month</label>
                  <select
                    value={monthKey}
                    onChange={e => setMonthKey(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] rounded-lg py-2 px-3 text-xs font-medium focus:outline-none"
                  >
                    {monthKeysList.map(mk => {
                      const parts = mk.split('-');
                      const year = parts[0];
                      const mNum = parts[1];
                      const mShort = monthNamesShort[mNum] || '';
                      return (
                        <option key={mk} value={mk}>
                          {mNum}/{year} {mShort}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    يرتبط الدين بكشف ميزانية الشهر المختار للتوزيع العادل.
                  </p>
                </div>

                {/* Action CTA */}
                <button
                  type="submit"
                  className="w-full bg-neutral-900 border border-[#d4af37]/35 hover:bg-neutral-800 text-[#d4af37] font-bold py-2.5 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة وتأكيد المديونية / Log Debt</span>
                </button>
              </form>
            </div>

            {/* Quick guidance alert */}
            <div className="bg-blue-50/40 border border-blue-200/50 rounded-xl p-4 mt-4 text-[11px] text-neutral-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                <AlertCircle size={14} className="text-blue-500" />
                <span>كيفية تصفية الديون وتسجيلها:</span>
              </div>
              <p className="leading-relaxed">
                الديون المضافة هنا ستحسب تلقائيا في ميزانية الشهر المختار. يمكنك بمجرد استيفاء الدين أو دفعه أن تضغط على علامة الصح الخضراء لتأشير الدين كـ <strong>"مسدد" (Paid)</strong>، مما يعيد ضبط رصيد المطلوبات الفعال.
              </p>
            </div>
          </div>

          {/* Ledger logs columns: Ledger Sheet (col: 8) */}
          <div className="lg:col-span-8 space-y-4" id="debts-ledger-sheet-pane">
            
            {/* Filter and search controllers */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Status pills tabs */}
              <div className="flex bg-neutral-100 p-1 rounded-lg w-full md:w-auto border border-neutral-200/50 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'all' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  الكل ({allDebts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('outstanding')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'outstanding' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-500 hover:text-rose-600'
                  }`}
                >
                  غير مسددة ({allDebts.filter(d => !d.tx.settled).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('settled')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'settled' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-500 hover:text-emerald-600'
                  }`}
                >
                  مسددة ({allDebts.filter(d => d.tx.settled).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('receivable')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'receivable' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-500 hover:text-blue-600'
                  }`}
                >
                  لنا ({allDebts.filter(d => d.tx.type === 'debt_receivable').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('payable')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'payable' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-purple-600'
                  }`}
                >
                  علينا ({allDebts.filter(d => d.tx.type === 'debt_payable').length})
                </button>
              </div>

              {/* Text Search input */}
              <div className="w-full md:w-44 relative">
                <input
                  type="text"
                  placeholder="بحث في الديون..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] rounded-lg py-1.5 px-3.5 text-xs font-medium focus:outline-none text-left"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Debts Table ledger list */}
            <div className="space-y-3" id="debts-listing-container">
              {filteredDebts.length === 0 ? (
                <div className="bg-white rounded-xl py-12 px-6 border border-neutral-200 text-center text-neutral-400 space-y-2.5 shadow-inner">
                  <Scale size={36} className="mx-auto text-[#d4af37]/50" />
                  <p className="text-sm font-bold text-neutral-600">لا توجد ديون مطابقة للمرشحات الحالية.</p>
                  <p className="text-xs">سجل مديونياتك لتتبعها وتسديدها بسهولة من لوحة التحكم.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredDebts.map(({ monthKey: assocMonthKey, tx }) => {
                    const isReceivable = tx.type === 'debt_receivable';
                    
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        key={tx.id}
                        className={`bg-white rounded-xl p-4 border border-neutral-250 hover:border-neutral-350 transition-all shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                          tx.settled ? 'opacity-70 bg-neutral-50/80 border-dashed border-neutral-200' : ''
                        }`}
                      >
                        {/* Status color indicator badge */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          tx.settled 
                            ? 'bg-emerald-500' 
                            : isReceivable 
                            ? 'bg-blue-500' 
                            : 'bg-purple-500'
                        }`}></div>

                        {/* Debt detail labels */}
                        <div className="space-y-1.5 pl-3 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold text-[#1c1c1c] text-sm ${tx.settled ? 'line-through text-neutral-400' : ''}`}>
                              {tx.text}
                            </h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              tx.settled 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : isReceivable 
                                ? 'bg-blue-50 text-blue-700 border-blue-105' 
                                : 'bg-purple-50 text-purple-700 border-purple-105'
                            }`}>
                              {tx.settled 
                                ? 'مسدد / Settle Paid' 
                                : isReceivable 
                                ? 'دين لنا مستحق' 
                                : 'دين علينا مطلوب'
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-neutral-400 text-[10px] sm:text-xs flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="shrink-0" />
                              <span>تاريخ العملية: {tx.date}</span>
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={11} className="shrink-0" />
                              <span>قيد: {assocMonthKey}</span>
                            </span>
                            {tx.settledAt && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <Check size={11} />
                                <span>سدد في: {formatDateTime(tx.settledAt)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right aligned values & settlement control action */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end pl-3">
                          <div className="text-left">
                            <span className={`font-mono text-base font-extrabold block ${
                              tx.settled 
                                ? 'text-neutral-400 line-through' 
                                : isReceivable 
                                ? 'text-blue-600' 
                                : 'text-purple-600'
                            }`}>
                              {isReceivable ? '+' : '-'}{formatNumber(tx.amount)}
                            </span>
                            <p className="text-[10px] text-neutral-400">JOD</p>
                          </div>

                          <div className="flex items-center gap-1.5 border-r border-neutral-150 pr-2 pl-1.5">
                            {/* Toggle Settle status button */}
                            <button
                              type="button"
                              onClick={() => onToggleSettleDebt(assocMonthKey, tx.id)}
                              className={`p-1.5 border rounded-lg transition-all flex items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
                                tx.settled
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-111 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={tx.settled ? 'تأشير كغير مسدد / Mark Unsettled' : 'تأشير كمسدد / Mark Settled'}
                            >
                              <Check size={14} className={tx.settled ? 'text-amber-700' : 'text-emerald-700'} />
                              <span className="text-[10px] hidden sm:inline">
                                {tx.settled ? 'إلغاء السداد' : 'تسديد'}
                              </span>
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من رغبتك في حذف قيد هذه المديونية نهائياً؟')) {
                                  onDeleteDebt(assocMonthKey, tx.id);
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="حذف الدين / Delete record"
                            >
                              <Trash2 size={13} />
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
