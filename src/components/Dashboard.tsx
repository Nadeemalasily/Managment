import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  FileText, 
  Trash2, 
  Lock, 
  LogOut, 
  Coins, 
  Scale,
  ChevronRight,
  Info,
  PiggyBank,
  Users,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, AppData, CashboxTransaction } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

interface DashboardProps {
  appData: AppData;
  onSelectMonth: (monthKey: string) => void;
  onSelectCashbox: () => void;
  onSelectSavings: () => void;
  onSelectDebts: () => void;
  onSelectReport: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
  onResetData: () => void;
  userRole?: 'admin' | 'user';
  userFullName?: string;
  onSelectAdmin?: () => void;
}

export default function Dashboard({
  appData,
  onSelectMonth,
  onSelectCashbox,
  onSelectSavings,
  onSelectDebts,
  onSelectReport,
  onLogout,
  onChangePassword,
  onResetData,
  userRole = 'user',
  userFullName = 'Guest',
  onSelectAdmin,
}: DashboardProps) {
  
  // Calculate Totals across all months
  let annualIncome = 0;
  let annualExpense = 0;
  let debtReceivableOutstanding = 0; // Active debts owed TO us (not settled)
  let debtPayableOutstanding = 0;    // Active debts we OWE (not settled)
  let totalDebtsSettled = 0;

  Object.values(appData?.months || {}).forEach((transactions: Transaction[]) => {
    (transactions || []).forEach(t => {
      if (t.type === 'income') {
        annualIncome += t.amount;
      } else if (t.type === 'expense') {
        annualExpense += t.amount;
      } else if (t.type === 'debt_receivable') {
        if (t.settled) {
          totalDebtsSettled += t.amount;
        } else {
          debtReceivableOutstanding += t.amount;
        }
      } else if (t.type === 'debt_payable') {
        if (t.settled) {
          totalDebtsSettled += t.amount;
        } else {
          debtPayableOutstanding += t.amount;
        }
      }
    });
  });

  // Balance calculations:
  const balanceExclDebts = annualIncome - annualExpense;

  // الصندوق Calculator:
  let cashboxCustomIncome = 0;
  let cashboxCustomExpense = 0;
  (appData?.cashboxTransactions || []).forEach((ct: CashboxTransaction) => {
    if (ct.type === 'income') {
      cashboxCustomIncome += ct.amount;
    } else {
      cashboxCustomExpense += ct.amount;
    }
  });

  // Safe Total = (All Months Income - All Months Expense) + Cashbox custom deposits - Cashbox custom withdrawals
  const totalCashbox = balanceExclDebts + cashboxCustomIncome - cashboxCustomExpense;

  // Savings box calculations:
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

  // Unified financial aggregates across core modules (Months and Cashbox - SAVINGS EXCLUDED)
  const totalOverallIncome = annualIncome + cashboxCustomIncome;
  const totalOverallExpense = annualExpense + cashboxCustomExpense;
  const totalLiquidAssets = totalCashbox;
  const totalOverallWithDebts = totalLiquidAssets + debtReceivableOutstanding - debtPayableOutstanding;

  // Month metadata map (Arabic names and localized display details)
  const monthNames: Record<string, { full: string; short: string; arabic: string }> = {
    '01': { full: 'January', short: 'Jan', arabic: 'يناير - كانون الثاني' },
    '02': { full: 'February', short: 'Feb', arabic: 'فبراير - شباط' },
    '03': { full: 'March', short: 'Mar', arabic: 'مارس - آذار' },
    '04': { full: 'April', short: 'Apr', arabic: 'أبريل - نيسان' },
    '05': { full: 'May', short: 'May', arabic: 'مايو - أيار' },
    '06': { full: 'June', short: 'Jun', arabic: 'يونيو - حزيران' },
    '07': { full: 'July', short: 'Jul', arabic: 'يوليو - تموز' },
    '08': { full: 'August', short: 'Aug', arabic: 'أغسطس - آب' },
    '09': { full: 'September', short: 'Sep', arabic: 'سبتمبر - أيلول' },
    '10': { full: 'October', short: 'Oct', arabic: 'أكتوبر - تشرين الأول' },
    '11': { full: 'November', short: 'Nov', arabic: 'نوفمبر - تشرين الثاني' },
    '12': { full: 'December', short: 'Dec', arabic: 'ديسمبر - كانون الأول' },
  };

  // State for chosen month
  const today = new Date();
  const currentMonthKey = `${appData.currentYear}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  
  // Safe validation check if default month exists in dictionary keys, otherwise take first key
  const sortedMonthKeys = Object.keys(appData?.months || {}).sort();
  const defaultSelectedKey = sortedMonthKeys.includes(currentMonthKey) ? currentMonthKey : (sortedMonthKeys[0] || '2026-06');
  
  const [selectedMonthState, setSelectedMonthState] = useState<string>(defaultSelectedKey);

  // Dynamic calculations for selected preview month
  const monthTransactions = (appData?.months || {})[selectedMonthState] || [];
  
  // Find cashbox transactions belonging to this month key (starts with selectedMonthState, e.g. "2026-06")
  const cashboxTxInMonth = (appData.cashboxTransactions || []).filter(tx => tx.date && tx.date.startsWith(selectedMonthState));

  // Map them into a unified display structure so they have similar fields (Savings Excluded)
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
    ...monthTransactions.map(t => ({
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
  let monthDebtsReceivable = 0;
  let monthDebtsPayable = 0;
  let monthDebtsSettledCount = 0;

  unifiedTransactions.forEach(t => {
    if (t.type === 'income' || t.type === 'cashbox_deposit') {
      monthIncome += t.amount;
    } else if (t.type === 'expense' || t.type === 'cashbox_withdrawal') {
      monthExpense += t.amount;
    } else if (t.type === 'debt_receivable') {
      if (t.settled) monthDebtsSettledCount += t.amount;
      else monthDebtsReceivable += t.amount;
    } else if (t.type === 'debt_payable') {
      if (t.settled) monthDebtsSettledCount += t.amount;
      else monthDebtsPayable += t.amount;
    }
  });

  const monthNet = monthIncome - monthExpense;
  const monthDebtsNet = monthDebtsReceivable - monthDebtsPayable;
  const monthTotalWithDebts = monthNet + monthDebtsNet;

  // Sorted list of month transactions to review
  const sortedTransactions = [...unifiedTransactions].sort((a, b) => {
    const dComp = b.date.localeCompare(a.date);
    if (dComp !== 0) return dComp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const currentMonthPart = selectedMonthState.split('-')[1];
  const currentMonthMeta = monthNames[currentMonthPart] || { full: 'Unknown', short: 'Month', arabic: 'غير معروف' };

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="dashboard-screen">
      
      {/* Upper Artistic Banner Header */}
      <div className="bg-[#1c1c1c] text-white pb-24 pt-8 px-4 rounded-b-[1.5rem] shadow-xl relative overflow-hidden border-b-4 border-[#d4af37]">
        {/* Fine gold lines decoration */}
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#d4af37]/5 blur-3xl"></div>
        <div className="absolute top-0 right-0 left-0 h-1 bg-[#d4af37]/30"></div>
        
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center border-2 border-[#d4af37] shadow-inner">
              <span className="text-xl font-bold text-[#d4af37]">
                {userFullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-semibold tracking-wide font-sans">
                مرحباً، {userFullName} 👋
              </p>
              <h1 className="text-lg md:text-xl font-light tracking-tight text-white">
                Month <span className="text-[#d4af37] font-bold font-sans">Management</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'admin' && onSelectAdmin && (
              <button
                id="admin-panel-btn"
                onClick={onSelectAdmin}
                title="Admin Control Panel"
                className="px-3 py-2 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] rounded-xl text-xs font-bold font-sans border border-[#d4af37]/35 hover:border-[#d4af37] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Users size={14} />
                <span>إدارة الحسابات</span>
              </button>
            )}
            
            <button
              id="change-lock-btn"
              onClick={onChangePassword}
              title="Change Password"
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 hover:text-[#d4af37] text-neutral-300 rounded-xl transition-all border border-neutral-800 hover:border-[#d4af37]/30 cursor-pointer"
            >
              <Lock size={18} />
            </button>
            <button
              id="logout-btn"
              onClick={onLogout}
              title="Log Out"
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl transition-all border border-rose-500/20 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Beautiful Passbook Style cards grid (3 modules: الصندوق، الحصالة، الديون) */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: الصندوق */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={onSelectCashbox}
            className="bg-neutral-950/60 backdrop-blur-md rounded-xl p-5 border border-[#d4af37]/30 shadow-2xl cursor-pointer hover:border-[#d4af37] transition-all text-left relative overflow-hidden group"
            id="cashbox-overview-card"
          >
            {/* Absolute accent gold band */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d4af37] rounded-l-xl group-hover:w-2 transition-all"></div>
            
            <div className="flex justify-between items-start pl-2">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/20 flex items-center gap-1 w-fit">
                  <Coins size={11} />
                  الصندوق التراكمي / Cashbox
                </span>
                <p className="text-[9px] text-neutral-400">
                  فائض ميزانيات الأشهر + المدخلات اليدوية
                </p>
              </div>
              <div className="p-2 bg-[#d4af37]/10 text-[#d4af37] rounded-lg border border-[#d4af37]/20 shrink-0">
                <Wallet size={16} />
              </div>
            </div>

            <div className="mt-4 pl-2 flex justify-between items-end">
              <div>
                <p className="text-[9px] text-neutral-400">الرصيد النقدي المتوفر</p>
                <div className="text-xl font-extrabold font-mono text-[#d4af37] mt-0.5">
                  {formatCurrency(totalCashbox)}
                </div>
              </div>
              <span className="text-[10px] text-[#d4af37] font-medium flex items-center gap-0.5 group-hover:translate-x-1 duration-200 shrink-0">
                دفتر الصندوق
                <ChevronRight size={12} />
              </span>
            </div>
          </motion.div>

          {/* Card 2: الحصالة */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={onSelectSavings}
            className="bg-neutral-950/60 backdrop-blur-md rounded-xl p-5 border border-emerald-500/30 shadow-2xl cursor-pointer hover:border-emerald-500 transition-all text-left relative overflow-hidden group"
            id="savings-box-overview-card"
          >
            {/* Absolute accent emerald band */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl group-hover:w-2 transition-all"></div>
            
            <div className="flex justify-between items-start pl-2">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 w-fit">
                  <PiggyBank size={11} />
                  الحصالة والادخارات / Savings
                </span>
                <p className="text-[9px] text-neutral-400 font-sans">
                  الأموال المدخرة والمعزولة في الخزنة الشخصية
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
                <PiggyBank size={16} />
              </div>
            </div>

            <div className="mt-4 pl-2 flex justify-between items-end">
              <div>
                <p className="text-[9px] text-neutral-400">مجموع الوفورات</p>
                <div className="text-xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  {formatCurrency(totalSaved)}
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 group-hover:translate-x-1 duration-200 shrink-0">
                الخزنة الادخارية
                <ChevronRight size={12} />
              </span>
            </div>
          </motion.div>

          {/* Card 3: الديون */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={onSelectDebts}
            className="bg-neutral-950/60 backdrop-blur-md rounded-xl p-5 border border-blue-500/30 shadow-2xl cursor-pointer hover:border-blue-500 transition-all text-left relative overflow-hidden group"
            id="debts-overview-card"
          >
            {/* Absolute accent blue band */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl group-hover:w-2 transition-all"></div>
            
            <div className="flex justify-between items-start pl-2">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 w-fit">
                  <Scale size={11} />
                  الديون والالتزامات / Debts
                </span>
                <p className="text-[9px] text-neutral-400">
                  تتبع المديونيات المستحقة والمطلوبة بالتفصيل
                </p>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 shrink-0">
                <Scale size={16} />
              </div>
            </div>

            <div className="mt-4 pl-2 flex justify-between items-end">
              <div>
                <p className="text-[9px] text-neutral-400">قيمة الديون المعلقة</p>
                <div className="text-xl font-extrabold font-mono text-blue-400 mt-0.5">
                  {formatCurrency(debtReceivableOutstanding - debtPayableOutstanding)}
                </div>
              </div>
              <span className="text-[10px] text-blue-400 font-medium flex items-center gap-0.5 group-hover:translate-x-1 duration-200 shrink-0">
                سجل الديون
                <ChevronRight size={12} />
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto mt-6 md:-mt-12 px-4 space-y-6">
        
        {/* Dynamic Financial Overview Deck */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-deck">
          {/* Card 1: Total Income */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#d4af37] flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-bold block">إجمالي المقبوضات الفعلي</span>
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 text-[#c29e2f] flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold font-mono text-[#1c1c1c]">
                {formatCurrency(totalOverallIncome)}
              </span>
              <p className="text-[9px] text-neutral-400 mt-1">المداخيل والمدخرات لعام {appData.currentYear}</p>
            </div>
          </div>

          {/* Card 2: Total Expense */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#1c1c1c] flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-bold block">إجمالي المصاريف السنوية</span>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold font-mono text-rose-600">
                {formatCurrency(totalOverallExpense)}
              </span>
              <p className="text-[9px] text-neutral-400 mt-1">المدفوعات والمسحوبات للعام {appData.currentYear}</p>
            </div>
          </div>

          {/* Card 3: Balance Excl Debts */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#d4af37]/50 flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-bold block">صافي الإيراد المالي</span>
              <div className="w-8 h-8 rounded-full bg-blue-505/10 bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-lg font-bold font-mono ${totalLiquidAssets >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {formatCurrency(totalLiquidAssets)}
              </span>
              <p className="text-[9px] text-neutral-400 mt-1">السيولة الصافية (الصندوق)</p>
            </div>
          </div>

          {/* Card 4: Balance Incl Debts */}
          <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-[#d4af37] flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-bold block">الرصيد الكلي المقدر مع الديون</span>
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-750 flex items-center justify-center border border-neutral-200">
                <Scale size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-lg font-bold font-mono ${totalOverallWithDebts >= 0 ? 'text-[#1c1c1c]' : 'text-rose-600'}`}>
                {formatCurrency(totalOverallWithDebts)}
              </span>
              <p className="text-[9px] text-neutral-400 mt-1">الرصيد المتوفر كاملاً بعد تسوية المطلوبات</p>
            </div>
          </div>
        </div>

        {/* Elegant educational detail bar */}
        <div className="bg-white border-l-4 border-[#d4af37] rounded-r-xl shadow-sm px-4 py-3 text-xs text-neutral-700 flex items-start gap-3">
          <Info size={16} className="text-[#d4af37] shrink-0 mt-0.5" />
          <p>
            <strong>الموازنة الشاملة لعام {appData.currentYear}:</strong> يدير هذا النظام ميزانيتك بأسلوب مالي آمن. الصندوق يعكس النقد الحاضر لديك، الحصالة تمكّنك من بناء وفورات للمستقبل، بينما قسم الديون يحميك من نسيان المطلوبات الذمية.
          </p>
        </div>

        {/* Premium Month Statement Picker and detailed checker (Hidden months until checked) */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm pt-5 px-6 pb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-neutral-800 flex items-center gap-2">
                <Calendar size={20} className="text-[#d4af37]" />
                <span>كشف الحساب الشهري والمدخلات التفصيلية</span>
              </h2>
              <p className="text-xs text-neutral-500">
                اختر الشهر الذي ترغب به لاستدعاء كافة الأرقام والمصروفات المسجلة بالتفصيل.
              </p>
            </div>

            {/* Premium Selector dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                id="month-selector-dropdown"
                value={selectedMonthState}
                onChange={e => setSelectedMonthState(e.target.value)}
                className="w-full sm:w-72 bg-neutral-900 text-white font-bold border-2 border-[#d4af37] pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#d4af37]/20 transition-all text-xs cursor-pointer appearance-none shadow-md"
              >
                {sortedMonthKeys.map(mk => {
                  const parts = mk.split('-');
                  const mNum = parts[1];
                  const year = parts[0];
                  const mmMeta = monthNames[mNum] || { full: 'Unknown', short: 'Month', arabic: 'غير معروف' };
                  return (
                    <option key={mk} value={mk} className="bg-neutral-900 text-white font-bold text-xs py-2">
                      {mNum}/{year} {mmMeta.short.toUpperCase()}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3.5 top-3.5 text-[#d4af37] pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Detailed Statement overview metrics for selected month */}
          <div className="bg-[#fcfcfa] rounded-xl border border-neutral-200/60 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4" id="month-preview-stats">
            <div className="border-r border-neutral-200/70 text-left pr-2">
              <span className="text-[10px] text-neutral-400 font-bold block">مجموع المقبوضات</span>
              <span className="text-xs text-neutral-500 block">Current Income</span>
              <strong className="text-sm font-mono text-blue-600 block mt-1">
                +{formatNumber(monthIncome)} JOD
              </strong>
            </div>

            <div className="border-r border-neutral-200/70 text-left pr-2">
              <span className="text-[10px] text-neutral-400 font-bold block">مجموع المصروفات</span>
              <span className="text-xs text-neutral-500 block">Current Expenses</span>
              <strong className="text-sm font-mono text-rose-500 block mt-1">
                -{formatNumber(monthExpense)} JOD
              </strong>
            </div>

            <div className="border-r border-neutral-200/70 text-left pr-2">
              <span className="text-[10px] text-neutral-400 font-bold block font-sans">فائض الشهر الفعلي</span>
              <span className="text-xs text-neutral-500 block">Net Liquid Left</span>
              <strong className={`text-sm font-mono block mt-1 ${monthNet >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {monthNet >= 0 ? `+${formatNumber(monthNet)}` : formatNumber(monthNet)} JOD
              </strong>
            </div>

            <div className="text-left pr-2">
              <span className="text-[10px] text-neutral-400 font-bold block">الديون والذمم المعلقة</span>
              <span className="text-xs text-neutral-500 block">Associated Month Debts</span>
              <strong className={`text-sm font-mono block mt-1 ${monthDebtsNet >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                {monthDebtsNet > 0 
                  ? `لك بـ +${formatNumber(monthDebtsReceivable)}` 
                  : monthDebtsNet < 0 
                  ? `عليك بـ -${formatNumber(monthDebtsPayable)}` 
                  : 'لا توجد ديون'}
              </strong>
            </div>
          </div>

          {/* All transactions inside this chosen month rendered in details (as requested!) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Clock size={14} className="text-[#d4af37]" />
                <span>كشف المدخلات التفصيلي ({currentMonthPart}/{selectedMonthState.split('-')[0]} {currentMonthMeta.short.toUpperCase()})</span>
              </h3>
              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-mono">
                {sortedTransactions.length} Inputs Active
              </span>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1" id="dashboard-month-detailed-list">
              {sortedTransactions.length === 0 ? (
                <div className="bg-[#fafaf8] border border-neutral-200 rounded-xl py-12 text-center text-neutral-400 space-y-3 shadow-inner">
                  <Calendar size={36} className="mx-auto text-neutral-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-700">لم تقم بتسجيل أي مدخلات لهذا الشهر بعد.</p>
                    <p className="text-[10px] text-neutral-400">انتقِ زر "تعديل وإضافة كشف الشهر" أدناه لبدء رصد المداخيل والمشتريات والالتزامات.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTransactions.map(tx => {
                    let typeClass = 'bg-blue-50 text-blue-800 border-blue-100';
                    let labelType = 'إيراد / Income';
                    let prefix = '+';
                    let amountColor = 'text-blue-600';

                    if (tx.type === 'expense' || tx.type === 'cashbox_withdrawal') {
                      typeClass = 'bg-rose-50 text-rose-800 border-rose-100';
                      labelType = tx.type === 'cashbox_withdrawal' 
                        ? 'سحب الصندوق / Cashbox Out' 
                        : 'مصروف شهري / Expense';
                      prefix = '-';
                      amountColor = 'text-rose-600';
                    } else if (tx.type === 'income' || tx.type === 'cashbox_deposit') {
                      typeClass = 'bg-blue-50 text-blue-850 border-blue-100';
                      labelType = tx.type === 'cashbox_deposit' 
                        ? 'إيداع الصندوق / Cashbox In'
                        : 'إيراد شهري / Income';
                      prefix = '+';
                      amountColor = 'text-blue-600';
                    } else if (tx.type === 'debt_receivable') {
                      typeClass = tx.settled 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-blue-50/70 text-blue-700 border-blue-100';
                      labelType = tx.settled ? 'دين مسترد (مسدد)' : 'دين لنا (مستحق)';
                      prefix = '•';
                      amountColor = 'text-blue-500';
                    } else if (tx.type === 'debt_payable') {
                      typeClass = tx.settled 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-purple-50 text-purple-700 border-purple-100';
                      labelType = tx.settled ? 'دين مدفوع (مسدد)' : 'دين علينا (مطلوب)';
                      prefix = '•';
                      amountColor = 'text-purple-600';
                    }

                    const txDay = tx.date.split('-')[2] || '01';

                    return (
                      <div 
                        key={tx.id} 
                        className="p-3 bg-white hover:bg-neutral-50 border border-neutral-200/70 rounded-lg flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Calendar date icon label */}
                          <div className="w-10 h-10 rounded-lg border border-neutral-150 bg-neutral-50/70 flex flex-col justify-center items-center text-center shrink-0">
                            <span className="text-xs font-mono font-bold leading-tight">{txDay}</span>
                            <span className="text-[8px] font-semibold text-neutral-400 font-sans tracking-tight uppercase">
                              {currentMonthMeta.short}
                            </span>
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <p className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                              {tx.text}
                            </p>
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border leading-none inline-block ${typeClass}`}>
                                {labelType}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border leading-none inline-block ${tx.sourceColorClass}`}>
                                {tx.sourceLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono text-xs sm:text-sm font-black ${amountColor}`}>
                            {prefix}{formatNumber(tx.amount)}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-bold block">JOD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action to modify month ledger */}
          <div className="pt-2 border-t border-neutral-100 flex justify-end">
            <button
              onClick={() => onSelectMonth(selectedMonthState)}
              className="px-5 py-3 w-full sm:w-auto bg-[#1c1c1c] hover:bg-neutral-800 border-l-4 border-[#d4af37] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Calendar size={14} className="text-[#d4af37]" />
              <span>إضافة وتعديل مدخلات هذا الشهر / Edit & Manage Ledger</span>
            </button>
          </div>
        </div>

        {/* Global actions */}
        <div className="pt-8 border-t border-neutral-250 flex flex-col sm:flex-row gap-3">
          <button
            id="view-report-btn"
            onClick={onSelectReport}
            className="flex-1 bg-[#1c1c1c] hover:bg-neutral-800 text-white font-bold py-3.5 px-6 rounded-xl border-l-4 border-[#d4af37] shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
          >
            <FileText size={18} className="text-[#d4af37]" />
            <span>عرض التقرير السنوي وحفظ كملف PDF / View Report Pdf</span>
          </button>

          <button
            id="reset-all-data-btn"
            onClick={onResetData}
            className="bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-200/50 font-bold py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs inline-flex"
          >
            <Trash2 size={16} />
            <span>تصفير البيانات لبدء سنة مالية جديدة / Restart Year</span>
          </button>
        </div>

      </div>
    </div>
  );
}
