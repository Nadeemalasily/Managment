import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Coins, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  Calendar, 
  Clock, 
  PlusCircle,
  PiggyBank,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CashboxTransaction, AppData } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

interface CashboxViewProps {
  appData: AppData;
  onBack: () => void;
  onAddCashboxTransaction: (transaction: Omit<CashboxTransaction, 'id' | 'createdAt'>) => void;
  onUpdateCashboxTransaction: (id: string, transaction: Omit<CashboxTransaction, 'id' | 'createdAt'>) => void;
  onDeleteCashboxTransaction: (id: string) => void;
}

export default function CashboxView({
  appData,
  onBack,
  onAddCashboxTransaction,
  onUpdateCashboxTransaction,
  onDeleteCashboxTransaction,
}: CashboxViewProps) {
  
  // State for adding/modifying direct cashbox transactions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income'); // income=deposit(إيداع), expense=withdrawal(سحب)
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Calculate annual totals from monthly ledgers
  let annualIncome = 0;
  let annualExpense = 0;
  Object.values(appData?.months || {}).forEach(transactions => {
    (transactions || []).forEach(t => {
      if (t.type === 'income') annualIncome += t.amount;
      else if (t.type === 'expense') annualExpense += t.amount;
    });
  });

  const monthsNetTotal = annualIncome - annualExpense;

  // Calculate direct cashbox transactions
  let directDeposits = 0;
  let directWithdrawals = 0;
  (appData?.cashboxTransactions || []).forEach(ct => {
    if (ct.type === 'income') directDeposits += ct.amount;
    else directWithdrawals += ct.amount;
  });

  const directNetSum = directDeposits - directWithdrawals;
  const overallCashboxBalance = monthsNetTotal + directNetSum;

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const data = {
      text: text.trim(),
      amount: parsedAmount,
      type,
      date: date || new Date().toISOString().split('T')[0],
    };

    if (editingId) {
      onUpdateCashboxTransaction(editingId, data);
    } else {
      onAddCashboxTransaction(data);
    }

    // Reset fields
    setText('');
    setAmount('');
    setEditingId(null);
  };

  const startEdit = (ct: CashboxTransaction) => {
    setEditingId(ct.id);
    setText(ct.text);
    setAmount(ct.amount.toString());
    setType(ct.type);
    setDate(ct.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText('');
    setAmount('');
    setType('income');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const filteredDirectTransactions = (appData?.cashboxTransactions || [])
    .filter(ct => {
      if (activeFilter === 'income') return ct.type === 'income';
      if (activeFilter === 'expense') return ct.type === 'expense';
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

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
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="cashbox-detailed-view-screen">
      
      {/* Upper Sticky Header in Charcoal */}
      <div className="bg-[#1c1c1c] text-white py-5 px-4 sticky top-0 z-40 shadow-md border-b-2 border-[#d4af37]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-all cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-[#d4af37]/30 py-1.5 px-3 rounded-lg text-xs font-bold"
            id="cashbox-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-bold text-neutral-400">Comprehensive Cashbox Ledger</h1>
            <p className="text-base font-black text-[#d4af37] mt-0.5 flex items-center justify-center gap-2">
              <Coins size={18} />
              <span>Full Cash Balance Reconciliation</span>
            </p>
          </div>

          <div className="w-16"></div> {/* spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* Golden Formula Board wrapper */}
        <div className="bg-[#1c1c1c] text-white rounded-xl p-6 shadow-xl border border-[#d4af37]/30 relative overflow-hidden" id="cashbox-formula-board">
          {/* Gold ribbon */}
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#d4af37]"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank size={14} />
                General Approved Cashbox Balance
              </h2>
              <p className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {formatCurrency(overallCashboxBalance)}
              </p>
              <p className="text-xs text-neutral-400">
                All records are compiled dynamically from your active local statements sheet.
              </p>
            </div>

            <div className="flex bg-neutral-950/40 rounded-xl p-4 divide-x divide-neutral-800 border border-[#d4af37]/20 gap-6">
              <div className="text-left pr-4">
                <p className="text-[10px] text-neutral-400">Cumulative Months Net</p>
                <p className={`text-sm font-extrabold font-mono mt-0.5 ${monthsNetTotal >= 0 ? 'text-[#d4af37]' : 'text-rose-400'}`}>
                  {monthsNetTotal >= 0 ? `+${formatNumber(monthsNetTotal)}` : formatNumber(monthsNetTotal)}
                </p>
              </div>
              <div className="text-right pl-4">
                <p className="text-[10px] text-neutral-400">Direct Cashbox Inputs</p>
                <p className={`text-sm font-extrabold font-mono mt-0.5 ${directNetSum >= 0 ? 'text-[#d4af37]' : 'text-rose-400'}`}>
                  {directNetSum >= 0 ? `+${formatNumber(directNetSum)}` : formatNumber(directNetSum)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informational help panel */}
        <div className="bg-white border-l-4 border-[#d4af37] rounded-r-xl shadow-sm px-4 py-3 text-xs text-neutral-700 flex gap-2.5 items-start">
          <Info size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
          <p>
            <strong>Cashbox Ledger:</strong> Use this panel to feed direct deposits and withdrawals (e.g. initial working credit, safety cash backing) that do not fall under a specific individual calendar month.
          </p>
        </div>

        {/* Form and ledger container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box entry form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm sticky top-24" id="cashbox-form-card">
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                <PlusCircle size={16} className="text-[#d4af37]" />
                {editingId ? 'Edit Entry' : 'Add Direct Cash Record'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount field */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Amount</label>
                  <div className="relative">
                    <input
                      id="cashbox-amount"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2.5 pl-12 pr-4 text-left font-mono text-base font-bold focus:outline-none transition-all"
                    />
                    <div className="absolute left-3 top-2.5 text-xs text-[#d4af37] font-bold">
                      JOD
                    </div>
                  </div>
                </div>

                {/* Text Description */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Statement Detail (Description)</label>
                  <input
                    id="cashbox-text"
                    type="text"
                    required
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="e.g. Liquid savings reserve..."
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none transition-all"
                  />
                </div>

                {/* Custom Transaction Date */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Value Date</label>
                  <input
                    id="cashbox-date"
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/10 rounded-lg py-2 px-4 text-xs font-mono font-medium focus:outline-none transition-all"
                  />
                </div>

                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2">Record Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`py-2 px-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        type === 'income'
                          ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#1c1c1c] shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <TrendingUp size={14} className="text-[#d4af37]" />
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-2 px-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        type === 'expense'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <TrendingDown size={14} />
                      Withdrawal
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-2 flex gap-2">
                  <button
                    id="submit-cashbox-btn"
                    type="submit"
                    className="flex-1 bg-[#1c1c1c] hover:bg-neutral-800 text-[#d4af37] border border-[#d4af37]/30 font-bold py-2.5 rounded-lg shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {editingId ? <Save size={14} /> : <Plus size={14} />}
                    <span>{editingId ? 'Save Changes' : 'Add Cash Input'}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-2.5 px-3 rounded-lg transition-all text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Direct Cashbox list ledger */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Quick Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Directly Entered Inputs:</span>
              <div className="flex bg-neutral-150 p-0.5 rounded-lg border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'all' ? 'bg-[#1c1c1c] text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  All ({appData.cashboxTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('income')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'income' ? 'bg-[#d4af37] text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Deposits
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('expense')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Withdrawals
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3" id="cashbox-entries-container">
              {filteredDirectTransactions.length === 0 ? (
                <div className="bg-white rounded-xl py-12 px-6 border border-neutral-200 text-center text-neutral-400 space-y-2 shadow-inner">
                  <Coins size={36} className="mx-auto text-[#d4af37]/60" />
                  <p className="text-sm font-bold text-neutral-700">No custom transactions logged.</p>
                  <p className="text-xs">Your cashbox is also fed automatically by transactions inside the 12-month statements.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredDirectTransactions.map(ct => {
                    const isIncome = ct.type === 'income';
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        key={ct.id}
                        className={`bg-white rounded-xl p-4.5 border border-neutral-200 flex items-center justify-between hover:shadow-xs transition-all ${
                          editingId === ct.id ? 'ring-2 ring-[#d4af37]' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#1c1c1c] text-xs sm:text-sm text-left leading-tight">
                              {ct.text}
                            </h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              isIncome ? 'bg-[#d4af37]/10 text-[#c29e2f] border-[#d4af37]/25' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {isIncome ? 'Direct Deposit' : 'Direct Withdrawal'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-neutral-400 text-[10px] sm:text-xs">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatDateTime(ct.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar size={11} />
                              {ct.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left">
                            <span className={`font-mono text-base font-extrabold ${isIncome ? 'text-[#c29e2f]' : 'text-rose-600'}`}>
                              {isIncome ? '+' : '-'}{formatNumber(ct.amount)}
                            </span>
                            <p className="text-[10px] text-neutral-400">JOD</p>
                          </div>

                          <div className="flex items-center gap-1 border-r border-[#fdfdfb]-200 pr-3">
                            <button
                                // use specific type to bypass any click propagation
                              type="button"
                              onClick={() => startEdit(ct)}
                              className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-neutral-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this cashbox transaction?')) {
                                  onDeleteCashboxTransaction(ct.id);
                                  if (editingId === ct.id) cancelEdit();
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Entry"
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
