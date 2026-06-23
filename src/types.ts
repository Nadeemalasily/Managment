export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;  // Description
  amount: number;
  type: 'income' | 'expense' | 'debt_receivable' | 'debt_payable'; // 'debt_receivable' is debts to us (ديون لنا), 'debt_payable' is debts by us (ديون علينا)
  createdAt: string; // Time of entry
  settled?: boolean; // Whether the debt has been marked as paid/settled
  settledAt?: string; // Time of settlement
}

export interface CashboxTransaction {
  id: string;
  date: string;
  text: string;
  amount: number;
  type: 'income' | 'expense'; // 'income' = deposit (إيداع), 'expense' = withdrawal (سحب)
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;  // Description
  amount: number;
  type: 'deposit' | 'withdrawal'; // 'deposit' = add to savings pot, 'withdrawal' = spend/withdraw from savings pot
  createdAt: string;
}

export interface AppData {
  months: Record<string, Transaction[]>; // Key: "YYYY-MM" (e.g., "2026-01")
  cashboxTransactions: CashboxTransaction[];
  savingsTransactions?: SavingsTransaction[]; // Mark optional for backward compatibility
  passwordHash: string;
  isPasswordSet: boolean;
  currentYear: number;
}
