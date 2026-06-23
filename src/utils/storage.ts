import { AppData, Transaction, CashboxTransaction } from '../types';

const STORAGE_KEY = 'month_management_app_data';

export const DEFAULT_PASSWORD_HASH = '1234'; // Fallback if somehow empty, but user should set their own.

export const INITIAL_DATA: AppData = {
  months: {
    '2026-01': [],
    '2026-02': [],
    '2026-03': [],
    '2026-04': [],
    '2026-05': [],
    '2026-06': [],
    '2026-07': [],
    '2026-08': [],
    '2026-09': [],
    '2026-10': [],
    '2026-11': [],
    '2026-12': [],
  },
  cashboxTransactions: [],
  savingsTransactions: [],
  passwordHash: '',
  isPasswordSet: false,
  currentYear: 2026,
};

export function loadAppData(): AppData {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) {
      return { ...INITIAL_DATA };
    }
    const parsed = JSON.parse(dataStr) as AppData;
    
    // Ensure all 12 months exist in record
    if (!parsed.months) {
      parsed.months = {};
    }
    const year = parsed.currentYear || 2026;
    for (let m = 1; m <= 12; m++) {
      const mStr = m.toString().padStart(2, '0');
      const key = `${year}-${mStr}`;
      if (!parsed.months[key]) {
        parsed.months[key] = [];
      }
    }
    if (!parsed.cashboxTransactions) {
      parsed.cashboxTransactions = [];
    }
    if (!parsed.savingsTransactions) {
      parsed.savingsTransactions = [];
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load app data:', error);
    return INITIAL_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save app data:', error);
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-JO', {
    style: 'currency',
    currency: 'JOD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Clean simple custom currency formatter without currency code for places where just the number is needed.
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
