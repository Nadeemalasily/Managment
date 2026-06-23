import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Key, 
  Download, 
  Upload, 
  ArrowLeft, 
  ShieldAlert, 
  UserCheck, 
  Database,
  Calendar,
  Layers,
  Lock,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../utils/api';

interface AdminPanelProps {
  onBack: () => void;
  currentUser: { username: string; fullName: string };
}

export default function AdminPanel({ onBack, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  
  // Password change state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Status and error messages
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  // Fetch users list
  const loadUsersList = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err: any) {
      showMsg(err?.message || 'Failed to retrieve active users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg({ text: '', type: '' });
    }, 4500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showMsg('اسم المستخدم و كلمة المرور مطلوبين / Username & Password are required.', 'error');
      return;
    }

    try {
      await api.createUser({
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim() || username.trim(),
        role
      });
      showMsg(`تم إضافة الحساب بنجاح / User ${username} successfully registered!`, 'success');
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('user');
      await loadUsersList();
    } catch (err: any) {
      showMsg(err?.message || 'Error occurred while creating client account.', 'error');
    }
  };

  const handleDeleteUser = async (userToDelete: string) => {
    const isConfirmed = window.confirm(
      `⚠️ فـتـرة تأكيدية حـسـاسـة:\n\nهل أنت متأكد من حذف الحساب "${userToDelete}" وجميع ميزانياته وسجلاته من الخادم نهائياً؟\n\nThis cannot be undone. All budget histories for this profile will be permanently deleted.`
    );
    if (!isConfirmed) return;

    try {
      await api.deleteUser(userToDelete);
      showMsg('تم حذف الحساب والبيانات التابعة له بنجاح / Purged user successfully.', 'success');
      await loadUsersList();
    } catch (err: any) {
      showMsg(err?.message || 'Deletion of user failed.', 'error');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPassword.trim()) return;

    try {
      await api.changeUserPassword(editingUser, newPassword.trim());
      showMsg(`تم تعديل كلمة مرور الحساب (${editingUser}) بنجاح!`, 'success');
      setEditingUser(null);
      setNewPassword('');
    } catch (err: any) {
      showMsg(err?.message || 'Error editing password.', 'error');
    }
  };

  const handleBackupExport = () => {
    // Standard direct dynamic download download triggers
    window.location.href = '/api/admin/backup/export';
    showMsg('جاري تحميل ملف نسخة احتياطية كاملة مدمجة! / Backup downloaded successfully!', 'success');
  };

  const handleBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.prompt(
      '⚠️ تـنـبـيـه حـسـاس:\nاستيراد نسخة احتياطية سيمسح البيانات الحالية ويستبدلها بالكامل.\n\nلتأكيد الاستعادة، يرجى كتابة كلمة "RESTORE" باللغة الإنجليزية في المربع أدناه:'
    );
    if (confirmRestore !== 'RESTORE') {
      alert('تم إلغاء عملية الاستعادة: مصطلح التأكيد الخاطئ.');
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await api.importBackup(json);
          alert('✨ تم استيراد وتحديث النظام والبيانات والحسابات بنجاح! / Database successfully restored from file!');
          e.target.value = '';
          await loadUsersList();
        } catch (err: any) {
          alert('خطأ في معالجة ملف النسخة: ' + (err?.message || 'تنسيق غير مدعوم.'));
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      showMsg('Import backup failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#1c1c1c] pb-16 font-sans select-none" id="admin-panel-screen">
      
      {/* Banner / Header Bar */}
      <div className="bg-[#1c1c1c] text-white pb-20 pt-8 px-4 rounded-b-[1.5rem] shadow-xl relative overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#d4af37]/5 blur-3xl"></div>
        <div className="absolute top-0 right-0 left-0 h-1 bg-[#d4af37]/30"></div>
        
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 bg-neutral-900 duration-200 hover:bg-neutral-800 text-[#d4af37] rounded-xl border border-neutral-800 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[11px] text-neutral-400 font-medium tracking-wide">لوحة تحكم المشرف الرئيسي / System Owner Panel</p>
              <h1 className="text-xl font-light tracking-tight text-white font-sans flex items-center gap-2">
                إدارة <span className="text-[#d4af37] font-bold">المستخدمين وقواعد البيانات</span>
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-right bg-neutral-900/60 p-3 rounded-xl border border-[#d4af37]/10 text-[#d4af37] text-xs font-serif font-mono">
            <Database size={16} />
            <span>DB LOCAL ENGINE (Stateless Cloud Active)</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 md:-mt-10 px-4 space-y-6">
        
        {/* Status Message Display */}
        {statusMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl shadow-md border-l-4 text-sm font-semibold flex items-center gap-3 ${
              statusMsg.type === 'success' 
              ? 'bg-emerald-55 border-emerald-500 bg-emerald-50 text-emerald-800' 
              : 'bg-rose-50 border-rose-500 text-rose-800'
            }`}
          >
            <ShieldAlert size={18} className={statusMsg.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
            <span className="font-sans leading-relaxed">{statusMsg.text}</span>
          </motion.div>
        )}

        {/* System Warnings & Backup prompt box */}
        <div className="bg-white rounded-xl border-l-4 border-amber-500 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-sm">
            <ShieldAlert size={20} />
            <h2>تعليمات ونظام إدارة الحسابات والبيانات / Access & Database System Instructions</h2>
          </div>
          <div className="text-xs text-neutral-600 leading-relaxed space-y-1.5 font-sans">
            <p>
              • <strong>توزيع الحسابات:</strong> بصفتك مالك النظام، يمكنك إنشاء حسابات باسم مستخدم وكلمة مرور مخصصة وتوزيعها على عملائك أو موظفيك لفتح التطبيق من أي جهاز (هاتف أو ديسكتوب).
            </p>
            <p className="text-teal-700 font-medium font-sans">
              • 💾 <strong>حفظ خط الديمومة:</strong> يرجى تحميل ملف نسخة احتياطية بنقرة واحدة (Backup Export) بعد كل تعديل رئيسي للحسابات أو الميزانيات، حتى تتمكن من استعادتها في أي وقت بضغطة زر إذا تمت إعادة ضبط الخادم.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Section A: Active Accounts Management (LHS - Span 8) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users size={18} className="text-[#d4af37]" />
                  <h3 className="font-bold text-[#1c1c1c] text-sm">قائمة الحسابات النشطة والمستخدمة ({users.length})</h3>
                </div>
                <button 
                  onClick={loadUsersList}
                  title="Refresh users"
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-[#d4af37]"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center text-neutral-400 text-xs">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#d4af37] border-t-transparent mx-auto mb-3"></div>
                  <span>جاري سحب الحسابات من الخادم...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-neutral-50 text-neutral-400 uppercase font-mono tracking-wider font-semibold border-b border-neutral-100 text-[10px]">
                      <tr>
                        <th className="py-3 px-4">اسم الحساب / User</th>
                        <th className="py-3 px-4">المالك / Client Name</th>
                        <th className="py-3 px-4 hidden sm:table-cell">تاريخ الإنشاء / Created</th>
                        <th className="py-3 px-4">آخر دخول / Last Active</th>
                        <th className="py-3 px-4 text-center">المدخلات / Count</th>
                        <th className="py-3 px-4 text-right">الإجراءات / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-sans">
                      {users.map(u => (
                        <tr key={u.username} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${u.role === 'admin' ? 'bg-[#d4af37]' : 'bg-emerald-400'}`}></span>
                              <span className="font-bold text-neutral-800 font-mono text-[13px]">{u.username}</span>
                              {u.username === currentUser.username && (
                                <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] px-1.5 py-0.5 rounded font-bold">YOU</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-neutral-600">{u.fullName}</td>
                          <td className="py-3.5 px-4 text-neutral-400 hidden sm:table-cell">
                            <span className="font-mono">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500">
                            {u.lastLogin ? (
                              <span className="font-mono text-neutral-600">{new Date(u.lastLogin).toLocaleDateString() + ' ' + new Date(u.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            ) : (
                              <span className="text-neutral-300 italic">No entry yet</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-800">
                            {u.totalTxCount || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUser(u.username);
                                  setNewPassword('');
                                }}
                                title="Change user password"
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-amber-600 rounded-lg transition-all cursor-pointer"
                              >
                                <Key size={14} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                disabled={u.username === currentUser.username}
                                title={u.username === currentUser.username ? 'Cannot delete self' : 'Permanently Delete User data'}
                                className={`p-1.5 rounded-lg transition-all ${
                                  u.username === currentUser.username 
                                  ? 'opacity-25 cursor-not-allowed bg-neutral-100 text-neutral-300' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 cursor-pointer'
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Side Panels (RHS - Create & Server Ops) (LHS - Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Form A: Register User Account */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <UserPlus size={18} className="text-[#d4af37]" />
                <h3 className="font-bold text-sm text-neutral-800">إنشاء حساب مستخدم جديد</h3>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans text-right">
                <div>
                  <label className="block text-right text-xs text-neutral-500 font-semibold mb-1">
                    اسم المستخدم الجديد (أحرف إنجليزية وأرقام فقط)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] text-neutral-800 rounded-lg p-2.5 text-center font-mono text-[13px] focus:outline-none"
                    placeholder="مثال: custom_client2026"
                    required
                  />
                </div>

                <div>
                  <label className="block text-right text-xs text-neutral-500 font-semibold mb-1">
                    كلمة المرور الابتدائية
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] text-neutral-800 rounded-lg p-2.5 text-center font-mono focus:outline-none"
                    placeholder="امزج أرقاماً و حروفاً"
                    required
                  />
                </div>

                <div>
                  <label className="block text-right text-xs text-neutral-500 font-semibold mb-1">
                    الاسم التعريفي للمالك (يظهر بالترحاب)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] text-neutral-800 rounded-lg p-2.5 text-center focus:outline-none"
                    placeholder="مثال: شركة سياحة الأصالة"
                    required
                  />
                </div>

                <div>
                  <label className="block text-right text-xs text-neutral-500 font-semibold mb-1">
                    صلاحية الحساب المنشأ
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#d4af37] text-neutral-800 rounded-lg p-2.5 focus:outline-none text-center font-sans font-medium"
                  >
                    <option value="user">مستخدم عادي / Standard Client Node</option>
                    <option value="admin">مشرف إداري كامل / Full Administrator</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1c1c1c] hover:bg-neutral-800 text-white hover:text-[#d4af37] py-3 px-4 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-2 font-sans active:scale-95"
                >
                  <UserPlus size={16} />
                  <span>تأكيد تسجيل الحساب الجديد</span>
                </button>
              </form>
            </div>

            {/* Form B: Password Modifier Overlay popup lookalike */}
            {editingUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 text-white rounded-xl border border-amber-500/40 p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
                    <Key size={14} />
                    تحديث كلمة مرور الحساب
                  </span>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="text-neutral-500 hover:text-white font-mono text-xs cursor-pointer"
                  >
                    إلغاء / X
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 font-sans text-right">
                  يرجى تحديد كلمة المرور الجديدة للحساب: <strong className="text-white font-mono text-[12px]">{editingUser}</strong>
                </p>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-black text-white text-center font-mono border border-neutral-800 focus:border-amber-400 rounded-lg p-2 focus:outline-none"
                    placeholder="كلمة المرور الجديدة"
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all text-center block"
                  >
                    حفظ التغييرات
                  </button>
                </form>
              </motion.div>
            )}

            {/* Container C: Database Safe backup imports and exports */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Database size={18} className="text-[#d4af37]" />
                <h3 className="font-bold text-sm text-neutral-800 font-sans">عمليات الأمن و النسخ الاحتياطي</h3>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {/* Export button */}
                <button
                  type="button"
                  onClick={handleBackupExport}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white hover:text-[#d4af37] py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 font-bold select-none text-[11px]"
                >
                  <Download size={15} />
                  <span>تصدير نسخة احتياطية (JSON Backup)</span>
                </button>

                <div className="relative">
                  <label className="text-[10px] text-neutral-400 font-medium block text-right mb-1">
                    استيراد مـلـف نسـخة احتـياطيـة (Restore JSON)
                  </label>
                  <div className="border-2 border-dashed border-neutral-200 rounded-xl hover:border-[#d4af37] transition-all p-3 text-center cursor-pointer relative overflow-hidden group">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupImport}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload size={18} className="text-neutral-400 group-hover:text-[#d4af37] mx-auto mb-1 duration-200" />
                    <span className="text-[10px] text-neutral-500 group-hover:text-[#d4af37] font-semibold block">اختر ملف .json من جهازك للاستعادة</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

        </div>

      </div>
    </div>
  );
}
