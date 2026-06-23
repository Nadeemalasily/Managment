import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// JSON database file path (relative to workspace root)
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface structures for DB
interface User {
  username: string;
  passwordHash: string; // Stored securely
  role: 'admin' | 'user';
  createdAt: string;
  fullName?: string;
  lastLogin?: string;
}

// ==================== LIST OF PERMANENT USERS (قائمة المستخدمين الدائمين) ====================
// يمكنك إضافة، تعديل أو حذف حسابات المستخدمين هنا مباشرة في الكود وسيقوم النظام تلقائياً بتحديث قاعدة البيانات عند التشغيل (مفيد جداً لـ Render).
const HARDCODED_USERS: User[] = [
  {
    username: 'admin',
    passwordHash: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    fullName: 'System Administrator (Nadeem)',
  },
  // أضف أي مستخدمين إضافيين تريدهم هنا مباشرة بالأسفل بنفس الطريقة:
  {
     username: 'ABDZOOZ',
     passwordHash: 'Ab@2026@Zooz',
     role: 'user',
     createdAt: new Date().toISOString(),
     fullName: 'Abd Alaziz ',
   },
   {
     username: 'Abed_Alnajjar',
     passwordHash: 'Axe@2026@Najjar',
     role: 'user',
     createdAt: new Date().toISOString(),
     fullName: 'Abed Alnajjar',
   },
   {
     username: 'Zainab',
     passwordHash: 'Zia@2025@ELyas',
     role: 'user',
     createdAt: new Date().toISOString(),
     fullName: 'Zainab ELyas',
   }
];

interface BudgetData {
  months: Record<string, any[]>;
  cashboxTransactions: any[];
  savingsTransactions?: any[];
  currentYear: number;
}

interface DatabaseSchema {
  users: User[];
  budgets: Record<string, BudgetData>; // Keyed by username
}

// Ensure the data directory and db.json exist
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultDb: DatabaseSchema = {
    users: [...HARDCODED_USERS],
    budgets: {}
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
    console.log('Database initialized successfully at:', DB_FILE);
  } else {
    try {
      // Validate schema
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.users || !parsed.budgets) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
        console.log('Database re-initialized due to corrupted template.');
      } else {
        // Dynamic Sync: تأكيد وجود جميع الحسابات المكتوبة يدوياً في الكود وتحديثها إذا تم تغيير كلمة المرور
        let modified = false;
        HARDCODED_USERS.forEach(hu => {
          const existingUserIndex = parsed.users.findIndex((u: any) => u.username.toLowerCase() === hu.username.toLowerCase());
          if (existingUserIndex === -1) {
            parsed.users.push(hu);
            modified = true;
          } else {
            // تحديث كلمة المرور أو البيانات إذا تم تعديلها في دالة HARDCODED_USERS البرمجية
            const existingUser = parsed.users[existingUserIndex];
            if (existingUser.passwordHash !== hu.passwordHash || existingUser.role !== hu.role || (hu.fullName && existingUser.fullName !== hu.fullName)) {
              parsed.users[existingUserIndex] = {
                ...existingUser,
                passwordHash: hu.passwordHash,
                role: hu.role,
                fullName: hu.fullName || existingUser.fullName
              };
              modified = true;
            }
          }
        });

        if (modified) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          console.log('Database successfully synced with HARDCODED_USERS changes.');
        }
      }
    } catch {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
    }
  }
}

// Read database
function readDb(): DatabaseSchema {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error('Failed to read db file, returning empty schema:', error);
    return { users: [], budgets: {} };
  }
}

// Write database
function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to db file:', error);
  }
}

async function startServer() {
  initDatabase();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper middleware for auth checks
  const getAuthenticatedUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const db = readDb();
    // In our simple token strategy, the token is simply "user:username"
    const parsed = authHeader.split(' ');
    if (parsed.length !== 2 || parsed[0] !== 'Bearer') return null;
    
    const token = parsed[1];
    const username = token.replace('token_', '');
    const user = db.users.find(u => u.username === username);
    return user || null;
  };

  // Auth Middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }
    (req as any).user = user;
    next();
  };

  // Admin Middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access requested' });
      return;
    }
    next();
  };

  // ===================== API ENDPOINTS =====================

  // 1. Health & Server Info
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', date: new Date().toISOString() });
  });

  // 2. Authentication: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password details are required.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date().toISOString();
    writeDb(db);

    // Simple token payload
    res.json({
      token: `token_${user.username}`,
      username: user.username,
      role: user.role,
      fullName: user.fullName || user.username
    });
  });

  // 3. Get currently logged in user metadata
  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json({
      username: user.username,
      role: user.role,
      fullName: user.fullName || user.username
    });
  });

  // 4. Budget Data: GET user budget
  app.get('/api/budget', requireAuth, (req, res) => {
    const user = (req as any).user;
    const db = readDb();
    
    // Ensure the budget record object exists
    if (!db.budgets[user.username]) {
      db.budgets[user.username] = {
        months: {
          '2026-01': [], '2026-02': [], '2026-03': [], '2026-04': [],
          '2026-05': [], '2026-06': [], '2026-07': [], '2026-08': [],
          '2026-09': [], '2026-10': [], '2026-11': [], '2026-12': [],
        },
        cashboxTransactions: [],
        savingsTransactions: [],
        currentYear: 2026
      };
      writeDb(db);
    }
    
    res.json(db.budgets[user.username]);
  });

  // 5. Budget Data: PUT/UPDATE user budget
  app.put('/api/budget', requireAuth, (req, res) => {
    const user = (req as any).user;
    const newData = req.body;
    
    if (!newData || typeof newData !== 'object') {
      res.status(400).json({ error: 'Invalid budget payload structure.' });
      return;
    }

    const db = readDb();
    db.budgets[user.username] = {
      months: newData.months || {},
      cashboxTransactions: newData.cashboxTransactions || [],
      savingsTransactions: newData.savingsTransactions || [],
      currentYear: newData.currentYear || 2026
    };

    writeDb(db);
    res.json({ success: true, message: 'Budget saved!' });
  });

  // 6. Admin Panel: Get all users with stats
  app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const userStatsList = db.users.map(u => {
      const budget = db.budgets[u.username] || { months: {}, cashboxTransactions: [], savingsTransactions: [] };
      
      // Calculate statistics dynamically
      let listTxCount = 0;
      Object.values(budget.months || {}).forEach((txArr: any) => {
        if (Array.isArray(txArr)) listTxCount += txArr.length;
      });
      const cashboxTxCount = (budget.cashboxTransactions || []).length;
      const savingsTxCount = (budget.savingsTransactions || []).length;
      const totalTxCount = listTxCount + cashboxTxCount + savingsTxCount;

      return {
        username: u.username,
        role: u.role,
        fullName: u.fullName || u.username,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        totalTxCount
      };
    });

    res.json(userStatsList);
  });

  // 7. Admin Panel: Create a user
  app.post('/api/admin/users/create', requireAuth, requireAdmin, (req, res) => {
    const { username, password, fullName, role } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password fields are required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Username can only contain alphanumeric letters and underscores.' });
      return;
    }

    const db = readDb();
    const exists = db.users.some(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      res.status(400).json({ error: 'Username is already taken by another client.' });
      return;
    }

    const newUser: User = {
      username: cleanUsername,
      passwordHash: password,
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      fullName: fullName || username
    };

    db.users.push(newUser);
    
    // Initialize empty budget structure for them
    db.budgets[cleanUsername] = {
      months: {
        '2026-01': [], '2026-02': [], '2026-03': [], '2026-04': [],
        '2026-05': [], '2026-06': [], '2026-07': [], '2026-08': [],
        '2026-09': [], '2026-10': [], '2026-11': [], '2026-12': [],
      },
      cashboxTransactions: [],
      savingsTransactions: [],
      currentYear: 2026
    };

    writeDb(db);
    res.json({ success: true, user: { username: cleanUsername, role: newUser.role, fullName: newUser.fullName } });
  });

  // 8. Admin Panel: Delete user
  app.delete('/api/admin/users/:username', requireAuth, requireAdmin, (req, res) => {
    const usernameToDelete = req.params.username.toLowerCase().trim();
    const currentUser = (req as any).user;

    if (usernameToDelete === currentUser.username.toLowerCase()) {
      res.status(400).json({ error: 'You cannot perform self-deletion of your admin account.' });
      return;
    }

    const db = readDb();
    const originalLength = db.users.length;
    db.users = db.users.filter(u => u.username.toLowerCase() !== usernameToDelete);

    if (db.users.length === originalLength) {
      res.status(404).json({ error: 'Requested user does not reside in the accounts list.' });
      return;
    }

    // Clean their budget record also
    delete db.budgets[usernameToDelete];
    writeDb(db);

    res.json({ success: true, message: `Account "${usernameToDelete}" and all of their budgets successfully purged.` });
  });

  // 9. Admin Panel: Change user password
  app.post('/api/admin/users/:username/password', requireAuth, requireAdmin, (req, res) => {
    const targetUsername = req.params.username.toLowerCase().trim();
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 3) {
      res.status(400).json({ error: 'The password must be at least 3 characters long.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === targetUsername);
    if (!user) {
      res.status(404).json({ error: 'Target user not found.' });
      return;
    }

    user.passwordHash = newPassword;
    writeDb(db);

    res.json({ success: true, message: 'Password has been successfully changed.' });
  });

  // 10. Admin Panel: Export Backup JSON
  app.get('/api/admin/backup/export', requireAuth, requireAdmin, (req, res) => {
    try {
      const db = readDb();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=month-management-backup-${Date.now()}.json`);
      res.send(JSON.stringify(db, null, 2));
    } catch (err) {
      res.status(500).json({ error: 'Failed to compile and download backup file.' });
    }
  });

  // 11. Admin Panel: Import Backup JSON
  app.post('/api/admin/backup/import', requireAuth, requireAdmin, (req, res) => {
    const backupData = req.body;
    
    if (!backupData || !Array.isArray(backupData.users) || !backupData.budgets) {
      res.status(400).json({ error: 'Invalid backup file structure. Must contain "users" array and "budgets" registry.' });
      return;
    }

    // Validate that there is at least one admin account
    const hasAdmin = backupData.users.some((u: any) => u.role === 'admin');
    if (!hasAdmin) {
      res.status(400).json({ error: 'Corrupt Backup block: must contain at least one valid administrator account.' });
      return;
    }

    // Save and overwrite
    writeDb(backupData);
    res.json({ success: true, message: `Database successfully restored. Loaded ${backupData.users.length} user profiles.` });
  });

  // ===================== STATIC & VITE MIDDLEWARES =====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Month Management Server] fully live on http://localhost:${PORT}`);
  });
}

startServer();
