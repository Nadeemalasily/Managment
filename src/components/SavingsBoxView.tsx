import React, { useState } from 'react';
import { 
  ArrowLeft, 
  PiggyBank, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Save, 
  Calendar, 
  Clock, 
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavingsTransaction, AppData } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

interface SavingsBoxViewProps {
  appData: AppData;
  onBack: () => void;
  onAddSavingsTransaction: (transaction: Omit<SavingsTransaction, 'id' | 'createdAt'>) => void;
  onUpdateSavingsTransaction: (id: string, transaction: Omit<SavingsTransaction, 'id' | 'createdAt'>) => void;
  onDeleteSavingsTransaction: (id: string) => void;
}

export default function SavingsBoxView({
  appData,
  onBack,
  onAddSavingsTransaction,
  onUpdateSavingsTransaction,
  onDeleteSavingsTransaction,
}: SavingsBoxViewProps) {
  
  // Local state for forms
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  // Calculations for total savings
  let totalSaved = 0;
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  const savingsList = appData.savingsTransactions || [];

  savingsList.forEach((st: SavingsTransaction) => {
    if (st.type === 'deposit') {
      totalDeposited += st.amount;
    } else {
      totalWithdrawn += st.amount;
    }
  });

  totalSaved = totalDeposited - totalWithdrawn;

  // Form Submit Action
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
      onUpdateSavingsTransaction(editingId, data);
    } else {
      onAddSavingsTransaction(data);
    }

    // Reset Form Fields
    setText('');
    setAmount('');
    setEditingId(null);
  };

  const startEdit = (st: SavingsTransaction) => {
    setEditingId(st.id);
    setText(st.text);
    setAmount(st.amount.toString());
    setType(st.type);
    setDate(st.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText('');
    setAmount('');
    setType('deposit');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const filteredTransactions = savingsList
    .filter(st => {
      if (activeFilter === 'deposit') return st.type === 'deposit';
      if (activeFilter === 'withdrawal') return st.type === 'withdrawal';
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
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="savings-view-screen">
      
      {/* Top Banner Accent Header */}
      <div className="bg-[#1c1c1c] text-white py-10 px-4 rounded-b-[1.5rem] shadow-xl relative overflow-hidden border-b-4 border-emerald-600">
        <div className="absolute top-0 right-1/3 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl"></div>
        <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500/20"></div>

        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-350 hover:text-white transition-all cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-emerald-500/35 py-1.5 px-3 rounded-lg text-xs font-bold"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-bold text-neutral-400">Personal Vault</h1>
            <p className="text-base font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1.5">
              <PiggyBank size={18} />
              Savings Save Box
            </p>
          </div>

          <div className="w-24"></div> {/* Balance spacer */}
        </div>

        {/* Big Savings Stats Card centered */}
        <div className="max-w-xl mx-auto mt-8 bg-neutral-950/70 border border-emerald-500/30 rounded-xl p-5 shadow-inner text-center">
          <p className="text-xs text-neutral-400 font-medium">Total Saved Safe Box Balance</p>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1 tracking-tight">
            {formatCurrency(totalSaved)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-800 text-[11px] font-mono">
            <div className="text-right border-r border-neutral-800 pr-4">
              <span className="text-neutral-400 block mb-0.5">Total Additions</span>
              <strong className="text-emerald-400">+{formatNumber(totalDeposited)} JOD</strong>
            </div>
            <div className="text-left pl-4">
              <span className="text-neutral-400 block mb-0.5">Total Spent/Withdrawn</span>
              <strong className="text-rose-400">-{formatNumber(totalWithdrawn)} JOD</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: Add/Edit Form (col: 5) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm" id="savings-add-form">
            <h2 className="text-sm font-bold text-[#1c1c1c] mb-4 flex items-center gap-2 border-b border-neutral-150 pb-2">
              <PiggyBank size={16} className="text-emerald-600" />
              {editingId ? 'Edit Vault Entry' : 'Add Vault Transaction'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector (Deposit Savings or Spend/Withdraw Savings) */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-2">Transaction Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('deposit')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      type === 'deposit'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    <TrendingUp size={14} className="text-emerald-600" />
                    Add Savings
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('withdrawal')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      type === 'withdrawal'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    <TrendingDown size={14} className="text-rose-600" />
                    Spend / Out
                  </button>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5">Cash Amount</label>
                <div className="relative">
                  <input
                    id="savings-amount-field"
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-lg py-2.5 pl-4 pr-12 text-sm font-mono font-extrabold focus:outline-none transition-all"
                  />
                  <div className="absolute right-3.5 top-3 text-[11px] font-bold text-neutral-400 font-mono tracking-wide">
                    JOD
                  </div>
                </div>
              </div>

              {/* Statement text label */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5">Description (Statement Label)</label>
                <input
                  id="savings-text-field"
                  type="text"
                  required
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="e.g. Wedding stash, Salary leftovers, Car fund..."
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none transition-all"
                />
              </div>

              {/* Custom registered Date picker */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-sans">Operation Date</label>
                <input
                  id="savings-date-field"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-lg py-2 px-4 text-xs font-mono font-medium focus:outline-none transition-all"
                />
              </div>

              {/* Actions buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-neutral-900 text-emerald-400 border border-emerald-500/30 hover:bg-neutral-800 font-bold py-2.5 rounded-lg shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {editingId ? <Save size={14} /> : <Plus size={14} />}
                  <span>{editingId ? 'Save Changes' : 'Insert Savings Entry'}</span>
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-neutral-205 hover:bg-neutral-300 bg-neutral-200 text-neutral-700 font-semibold py-2.5 px-3.5 rounded-lg transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-550/20 border-emerald-500/20 rounded-xl p-4 text-xs text-neutral-500 flex items-start gap-2">
            <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1c1c1c] mb-1">Savings Sandbox</p>
              <p className="leading-relaxed">This vault works as your personal digital save box to aggregate discrete assets. You can deposit money into it to isolate it, or register spent logs to subtract from it.</p>
            </div>
          </div>
        </div>

        {/* Right column: Transactions logs ledger (col: 7) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <h2 className="text-xs font-bold text-[#1c1c1c] uppercase tracking-wider">
                Savings Box Statements History
              </h2>

              <div className="flex items-center gap-1 scale-90 sm:scale-100 origin-right">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`py-1 px-3 text-2xs rounded-full font-bold transition-all text-[11px] cursor-pointer ${
                    activeFilter === 'all' 
                      ? 'bg-[#1a1a1a] text-white' 
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  All ({savingsList.length})
                </button>
                <button
                  onClick={() => setActiveFilter('deposit')}
                  className={`py-1 px-3 text-2xs rounded-full font-bold transition-all text-[11px] cursor-pointer ${
                    activeFilter === 'deposit' 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-neutral-500 hover:text-[#059669]'
                  }`}
                >
                  Additions
                </button>
                <button
                  onClick={() => setActiveFilter('withdrawal')}
                  className={`py-1 px-3 text-2xs rounded-full font-bold transition-all text-[11px] cursor-pointer ${
                    activeFilter === 'withdrawal' 
                      ? 'bg-rose-600 text-white' 
                      : 'text-neutral-500 hover:text-rose-650'
                  }`}
                >
                  Spendings
                </button>
              </div>
            </div>

            {/* List with motion.div for transitions */}
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 px-4 text-center text-neutral-400 space-y-2">
                  <PiggyBank size={36} className="mx-auto text-emerald-500/30" />
                  <p className="text-sm font-bold text-neutral-600">No vault statements found.</p>
                  <p className="text-xs">Add your first deposit to start accumulating savings!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map(st => {
                    const isDeposit = st.type === 'deposit';
                    const typeBadgeText = isDeposit ? 'Addition' : 'Spending';
                    const typeBadgeClass = isDeposit 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100';
                    const amountSign = isDeposit ? '+' : '-';
                    const amountClass = isDeposit ? 'text-emerald-600' : 'text-rose-600';

                    return (
                      <motion.div
                        key={st.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-150 flex items-center justify-between gap-4 hover:border-emerald-500/25 hover:bg-white transition-all"
                      >
                        <div className="space-y-1 text-left min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#1c1c1c] text-sm truncate leading-tight">
                              {st.text}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${typeBadgeClass}`}>
                              {typeBadgeText}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-neutral-400 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1">
                              <Clock size={11} className="shrink-0 text-emerald-555 text-emerald-600" />
                              <span>Logged at: {formatDateTime(st.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 font-mono">
                              <Calendar size={11} className="shrink-0 text-neutral-400" />
                              <span>{st.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`font-mono font-extrabold text-base ${amountClass}`}>
                              {amountSign} {formatNumber(st.amount)}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-bold block">JOD</span>
                          </div>

                          <div className="flex flex-col gap-1 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => startEdit(st)}
                              className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to permanently delete this savings entry?')) {
                                  onDeleteSavingsTransaction(st.id);
                                  if (editingId === st.id) {
                                    cancelEdit();
                                  }
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
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
