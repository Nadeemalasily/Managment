import { AppData } from '../types';

interface AuthSession {
  token: string;
  username: string;
  role: 'admin' | 'user';
  fullName: string;
}

const SESSION_KEY = 'month_management_session';

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as AuthSession : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Global authorization fetch wrapper
async function fetchApi(path: string, options: RequestInit = {}): Promise<any> {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...options, headers });
  
  if (res.status === 401) {
    clearSession();
    window.location.reload();
    throw new Error('Your session expired. Please sign in again.');
  }
  
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${res.status}`);
  }
  
  return res.json().catch(() => ({}));
}

// Expose API module functions
export const api = {
  // Auth endpoints
  async login(username: string, password: string): Promise<AuthSession> {
    const session = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    saveSession(session);
    return session;
  },

  async getMe() {
    return fetchApi('/api/auth/me');
  },

  // Budget data endpoints
  async loadBudget(): Promise<AppData> {
    return fetchApi('/api/budget');
  },

  async saveBudget(data: AppData): Promise<void> {
    await fetchApi('/api/budget', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Admin user management endpoints
  async listUsers(): Promise<any[]> {
    return fetchApi('/api/admin/users');
  },

  async createUser(payload: any): Promise<any> {
    return fetchApi('/api/admin/users/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteUser(username: string): Promise<any> {
    return fetchApi(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
  },

  async changeUserPassword(username: string, newPassword:  string): Promise<any> {
    return fetchApi(`/api/admin/users/${encodeURIComponent(username)}/password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  // Export full raw DB payload JSON
  getBackupExportUrl(): string {
    const session = getSession();
    return `/api/admin/backup/export?token=${session?.token || ''}`;
  },

  async importBackup(backupJsonData: any): Promise<void> {
    await fetchApi('/api/admin/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupJsonData)
    });
  }
};
