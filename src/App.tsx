import React, { useState, useEffect } from 'react';
import { AppData, Transaction, CashboxTransaction, SavingsTransaction } from './types';
import { api, getSession, clearSession } from './utils/api';
import PasswordLock from './components/PasswordLock';
import Dashboard from './components/Dashboard';
import MonthDetail from './components/MonthDetail';
import CashboxView from './components/CashboxView';
import SavingsBoxView from './components/SavingsBoxView';
import ReportView from './components/ReportView';
import AdminPanel from './components/AdminPanel';
import DebtsView from './components/DebtsView';

// Safe INITIAL_DATA model
export const INITIAL_DATA: AppData = {
  months: {
    '2026-01': [], '2026-02': [], '2026-03': [], '2026-04': [],
    '2026-05': [], '2026-06': [], '2026-07': [], '2026-08': [],
    '2026-09': [], '2026-10': [], '2026-11': [], '2026-12': [],
  },
  cashboxTransactions: [],
  savingsTransactions: [],
  passwordHash: '123',
  isPasswordSet: true,
  currentYear: 2026,
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'tx_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [appData, setAppData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'month' | 'cashbox' | 'report' | 'savings' | 'admin' | 'debts'>('dashboard');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Load user data once session is authenticated
  useEffect(() => {
    if (!session) return;
    
    setLoading(true);
    api.loadBudget()
      .then(data => {
        const sanitized: AppData = {
          months: data?.months || {},
          cashboxTransactions: data?.cashboxTransactions || [],
          savingsTransactions: data?.savingsTransactions || [],
          passwordHash: data?.passwordHash || '123',
          isPasswordSet: typeof data?.isPasswordSet === 'boolean' ? data.isPasswordSet : true,
          currentYear: data?.currentYear || 2026,
        };
        setAppData(sanitized);
      })
      .catch(err => {
        console.error('Failed to load budget records from the server:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  // Auth helper
  const handleAuthenticate = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    try {
      const sess = await api.login(usernameInput, passwordInput);
      setSession(sess);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  // Perform backend sync whenever appData state is updated
  const triggerAppDataSync = async (updatedData: AppData) => {
    setAppData(updatedData);
    if (!session) return;
    try {
      await api.saveBudget(updatedData);
    } catch (err) {
      console.error('Auto-sync budget fail:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    clearSession();
    setSession(null);
    setActiveView('dashboard');
  };

  // Re-verify/Reset admin passcode or personal pass codes
  const handleChangePassword = () => {
    if (!session) return;
    const newPass = window.prompt('يرجى تحديد كلمة المرور الجديدة للحساب / Set your new account password:');
    if (!newPass || newPass.trim().length < 3) {
      if (newPass) alert('يجب أن تكون كلمة المرور 3 خانات فأكثر.');
      return;
    }

    setLoading(true);
    api.changeUserPassword(session.username, newPass.trim())
      .then(() => {
        alert('✨ تم تحديث كلمة المرور بنجاح! / Password successfully updated!');
      })
      .catch(err => {
        alert('فشل عملية التحديث: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Reset database for current user
  const handleResetData = () => {
    const confirmation = window.confirm(
      '⚠️ تـنـبـيـه حـسـاس:\nهل أنت متأكد من مسح جميع المدخلات للعام الحريري لبدء سنة مالية جديدة؟\n\nConfirming will clear your transactions.'
    );
    if (confirmation) {
      const typedPrompt = window.prompt('يرجى كتابة كلمة "RESET" للتأكيد النهائي:');
      if (typedPrompt === 'RESET') {
        const freshData: AppData = {
          ...INITIAL_DATA,
          currentYear: appData.currentYear || 2026,
        };
        triggerAppDataSync(freshData);
        alert('تم مسح جميع مدخلات الحساب وبدء سنة مالية جديدة بنجاح! 🚀');
      }
    }
  };

  // Month-Detail transaction operations (CRUD)
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!selectedMonthKey) return;
    
    const id = generateId();
    const createdAt = new Date().toISOString();
    const fullTx: Transaction = {
      ...newTx,
      id,
      createdAt,
    };

    const existingTx = appData.months[selectedMonthKey] || [];
    const updatedMonths = {
      ...appData.months,
      [selectedMonthKey]: [...existingTx, fullTx],
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  const handleUpdateTransaction = (id: string, updatedFields: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!selectedMonthKey) return;

    const existingTx = appData.months[selectedMonthKey] || [];
    const updatedTx = existingTx.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields,
          createdAt: new Date().toISOString(),
        };
      }
      return t;
    });

    const updatedMonths = {
      ...appData.months,
      [selectedMonthKey]: updatedTx,
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!selectedMonthKey) return;

    const existingTx = appData.months[selectedMonthKey] || [];
    const filteredTx = existingTx.filter(t => t.id !== id);
    const updatedMonths = {
      ...appData.months,
      [selectedMonthKey]: filteredTx,
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  // Cashbox specific transaction operations (CRUD)
  const handleAddCashboxTransaction = (newCt: Omit<CashboxTransaction, 'id' | 'createdAt'>) => {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const fullCt: CashboxTransaction = {
      ...newCt,
      id,
      createdAt,
    };

    triggerAppDataSync({
      ...appData,
      cashboxTransactions: [...appData.cashboxTransactions, fullCt],
    });
  };

  const handleUpdateCashboxTransaction = (id: string, updatedFields: Omit<CashboxTransaction, 'id' | 'createdAt'>) => {
    const updatedCt = appData.cashboxTransactions.map(ct => {
      if (ct.id === id) {
        return {
          ...ct,
          ...updatedFields,
          createdAt: new Date().toISOString(),
        };
      }
      return ct;
    });

    triggerAppDataSync({
      ...appData,
      cashboxTransactions: updatedCt,
    });
  };

  const handleDeleteCashboxTransaction = (id: string) => {
    triggerAppDataSync({
      ...appData,
      cashboxTransactions: appData.cashboxTransactions.filter(ct => ct.id !== id),
    });
  };

  // Savings Box specific transaction operations (CRUD)
  const handleAddSavingsTransaction = (newSt: Omit<SavingsTransaction, 'id' | 'createdAt'>) => {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const fullSt: SavingsTransaction = {
      ...newSt,
      id,
      createdAt,
    };

    triggerAppDataSync({
      ...appData,
      savingsTransactions: [...(appData.savingsTransactions || []), fullSt],
    });
  };

  const handleUpdateSavingsTransaction = (id: string, updatedFields: Omit<SavingsTransaction, 'id' | 'createdAt'>) => {
    const updatedSt = (appData.savingsTransactions || []).map(st => {
      if (st.id === id) {
        return {
          ...st,
          ...updatedFields,
          createdAt: new Date().toISOString(),
        };
      }
      return st;
    });

    triggerAppDataSync({
      ...appData,
      savingsTransactions: updatedSt,
    });
  };

  const handleDeleteSavingsTransaction = (id: string) => {
    triggerAppDataSync({
      ...appData,
      savingsTransactions: (appData.savingsTransactions || []).filter(st => st.id !== id),
    });
  };

  // Debts and Liability specific activities callbacks
  const handleAddDebt = (monthKey: string, newDebt: Omit<Transaction, 'id' | 'createdAt' | 'settled' | 'settledAt'>) => {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const fullDebt: Transaction = {
      ...newDebt,
      id,
      createdAt,
      settled: false,
    };

    const existingTx = appData.months[monthKey] || [];
    const updatedMonths = {
      ...appData.months,
      [monthKey]: [...existingTx, fullDebt],
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  const handleToggleSettleDebt = (monthKey: string, id: string) => {
    const existingTx = appData.months[monthKey] || [];
    const updatedTx = existingTx.map(t => {
      if (t.id === id) {
        const nextSettled = !t.settled;
        return {
          ...t,
          settled: nextSettled,
          settledAt: nextSettled ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const updatedMonths = {
      ...appData.months,
      [monthKey]: updatedTx,
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  const handleDeleteDebt = (monthKey: string, id: string) => {
    const existingTx = appData.months[monthKey] || [];
    const filteredTx = existingTx.filter(t => t.id !== id);
    const updatedMonths = {
      ...appData.months,
      [monthKey]: filteredTx,
    };

    triggerAppDataSync({
      ...appData,
      months: updatedMonths,
    });
  };

  // Authentication Switch
  if (!session) {
    return (
      <PasswordLock
        onAuthenticate={handleAuthenticate}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#1c1c1c] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37] border-t-transparent mb-4"></div>
        <p className="font-sans text-xs text-neutral-400">جاري تحميل نظام الميزانيات الخاص بك...</p>
      </div>
    );
  }

  // Routing Switchboard
  switch (activeView) {
    case 'admin':
      return (
        <AdminPanel
          currentUser={{ username: session.username, fullName: session.fullName }}
          onBack={() => setActiveView('dashboard')}
        />
      );

    case 'month':
      if (!selectedMonthKey) {
        setActiveView('dashboard');
        return null;
      }
      return (
        <MonthDetail
          monthKey={selectedMonthKey}
          transactions={appData.months[selectedMonthKey] || []}
          cashboxTransactions={appData.cashboxTransactions || []}
          savingsTransactions={appData.savingsTransactions || []}
          onBack={() => {
            setSelectedMonthKey(null);
            setActiveView('dashboard');
          }}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          currentYear={appData.currentYear}
        />
      );
    
    case 'cashbox':
      return (
        <CashboxView
          appData={appData}
          onBack={() => setActiveView('dashboard')}
          onAddCashboxTransaction={handleAddCashboxTransaction}
          onUpdateCashboxTransaction={handleUpdateCashboxTransaction}
          onDeleteCashboxTransaction={handleDeleteCashboxTransaction}
        />
      );

    case 'savings':
      return (
        <SavingsBoxView
          appData={appData}
          onBack={() => setActiveView('dashboard')}
          onAddSavingsTransaction={handleAddSavingsTransaction}
          onUpdateSavingsTransaction={handleUpdateSavingsTransaction}
          onDeleteSavingsTransaction={handleDeleteSavingsTransaction}
        />
      );

    case 'report':
      return (
        <ReportView
          appData={appData}
          onBack={() => setActiveView('dashboard')}
        />
      );

    case 'debts':
      return (
        <DebtsView
          appData={appData}
          onBack={() => setActiveView('dashboard')}
          onAddDebt={handleAddDebt}
          onToggleSettleDebt={handleToggleSettleDebt}
          onDeleteDebt={handleDeleteDebt}
        />
      );

    case 'dashboard':
    default:
      return (
        <Dashboard
          appData={appData}
          userRole={session.role}
          userFullName={session.fullName}
          onSelectMonth={monthKey => {
            setSelectedMonthKey(monthKey);
            setActiveView('month');
          }}
          onSelectCashbox={() => setActiveView('cashbox')}
          onSelectSavings={() => setActiveView('savings')}
          onSelectDebts={() => setActiveView('debts')}
          onSelectReport={() => setActiveView('report')}
          onSelectAdmin={() => setActiveView('admin')}
          onLogout={handleLogout}
          onChangePassword={handleChangePassword}
          onResetData={handleResetData}
        />
      );
  }
}
