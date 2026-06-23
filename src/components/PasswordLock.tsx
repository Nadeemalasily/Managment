import React, { useState } from 'react';
import { Lock, LogIn, Users, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface PasswordLockProps {
  onAuthenticate: (username: string, password: string) => Promise<boolean>;
}

export default function PasswordLock({
  onAuthenticate,
}: PasswordLockProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور / Please enter username and password.');
      return;
    }

    setLoading(true);
    try {
      const success = await onAuthenticate(username.trim(), password.trim());
      if (!success) {
        setError('اسم مستخدم أو كلمة مرور غير صحيحة / Invalid username or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'فشل الاتصال بالخادم / Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#1c1c1c] text-white px-4 relative overflow-hidden" id="password-lock-screen">
      {/* Dynamic ambient gold lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#d4af37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-white/5 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900/95 backdrop-blur-md rounded-2xl p-8 border border-[#d4af37]/30 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-[#d4af37]/10 text-[#d4af37] rounded-full mb-1">
            <Lock size={32} className="animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-light tracking-tight text-white font-sans" id="app-title-display">
            Month <span className="font-bold text-[#d4af37]">Management</span>
          </h1>
          
          <p className="text-neutral-400 text-sm tracking-wide">
            ادخل اسم المستخدم وكلمة المرور للدخول للبرنامج
          </p>
          <p className="text-neutral-500 text-xs font-mono">
            Enter your credentials to access your financial dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-right text-xs text-[#d4af37] font-medium mb-1.5 font-sans">
                اسم المستخدم / Username
              </label>
              <div className="relative">
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={e => {
                    setError('');
                    setUsername(e.target.value);
                  }}
                  className="w-full bg-black/60 border border-neutral-800 focus:border-[#d4af37] text-white rounded-xl py-3 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all text-center"
                  placeholder="مثال: user123"
                  autoFocus
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-right text-xs text-[#d4af37] font-medium mb-1.5 font-sans">
                كلمة المرور / Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={e => {
                  setError('');
                  setPassword(e.target.value);
                }}
                className="w-full bg-black/60 border border-neutral-800 focus:border-[#d4af37] text-white rounded-xl py-3 px-4 text-center font-mono text-lg tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all placeholder:text-neutral-700"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-rose-400 text-xs text-center font-medium bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20 space-y-1 block"
              >
                <div className="flex items-center justify-center gap-1.5 text-rose-300 font-bold mb-1">
                  <ShieldAlert size={15} />
                  <span>تنبيه / Alert</span>
                </div>
                <p className="font-sans leading-relaxed">{error}</p>
              </motion.div>
            )}
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] hover:bg-[#c29e2f] text-black font-bold py-3.5 px-6 rounded-xl shadow-xl shadow-[#d4af37]/10 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></span>
            ) : (
              <>
                <LogIn size={18} />
                <span className="font-sans">تسجيل الدخول / Secure Login</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Decorative corporate bottom labels */}
      <div className="mt-8 text-center text-xs text-neutral-500 space-y-1 select-none">
        <p className="font-sans">نظام إدارة وتنظيم الميزانية الشهرية والتقارير المالية</p>
        <p className="font-mono text-[10px] tracking-widest text-[#d4af37]/60">MULTI-USER FINANCIAL SECURITY NETWORK</p>
      </div>
    </div>
  );
}
