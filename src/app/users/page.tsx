"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight, Plus, Users, Shield, UserCog, Trash2,
  Edit2, X, Save, Crown, User, Eye, Lock, CheckCircle2
} from "lucide-react";

interface AppUser {
  id: number;
  username: string;
  name: string;
  role: "admin" | "cashier" | "manager";
  createdAt: string;
}

const roleConfig = {
  admin: {
    label: "مدير النظام",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Crown,
    desc: "تحكم كامل بجميع خصائص النظام",
  },
  manager: {
    label: "مدير المحل",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: UserCog,
    desc: "التقارير وحركة المخزن بالكامل",
  },
  cashier: {
    label: "كاشير",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: User,
    desc: "شاشة الكاشير والبيع فقط",
  },
};

const permissions = {
  admin: [
    { icon: Shield, text: "إدارة المستخدمين", desc: "إضافة وحذف وتعديل الصلاحيات" },
    { icon: Eye, text: "التقارير الشاملة", desc: "الإيرادات، الأرباح، والمبيعات" },
    { icon: Lock, text: "إعدادات النظام", desc: "التحكم في الأساسيات" },
    { icon: CheckCircle2, text: "وصول غير محدود", desc: "كاشير + مخزن + تقارير" },
  ],
  manager: [
    { icon: Eye, text: "التقارير", desc: "مراجعة المبيعات والأرباح" },
    { icon: CheckCircle2, text: "إدارة المخزن", desc: "توريد وصرف وتعديل المنتجات" },
    { icon: CheckCircle2, text: "شاشة الكاشير", desc: "إتمام عمليات البيع" },
  ],
  cashier: [
    { icon: CheckCircle2, text: "الكاشير حصرياً", desc: "تنفيذ البيع وإنشاء الفواتير" },
    { icon: Eye, text: "عرض المنتجات", desc: "استعراض المخزون بدون تعديل" },
  ],
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier" as "admin" | "cashier" | "manager",
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("فشل في تحميل بيانات المستخدمين");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.username || (!editingUser && !form.password)) {
      toast.error("يرجى ملء كافة الحقول الإلزامية");
      return;
    }

    const data: any = {
      name: form.name,
      username: form.username,
      role: form.role,
    };
    if (form.password) data.password = form.password;

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editingUser ? "تم تحديث بيانات المستخدم" : "تم إضافة المستخدم بنجاح");
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "فشل في الحفظ، حاول مرة أخرى");
      }
    } catch {
      toast.error("توجد مشكلة في الاتصال بالخادم");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("تم حذف المستخدم بنجاح");
        fetchUsers();
      }
    } catch {
      toast.error("فشل في حذف المستخدم");
    }
  };

  const startEdit = (user: AppUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: "", username: "", password: "", role: "cashier" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-rose-200">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">إدارة المستخدمين</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">تحكم كامل في الصلاحيات وفرق العمل</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:-translate-y-0.5 text-[15px] font-bold"
        >
          <Plus className="w-5 h-5" />
          مستخدم جديد
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="إجمالي المستخدمين" value={users.length.toString()} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="مدراء النظام" value={users.filter(u => u.role === "admin").length.toString()} icon={Crown} color="text-amber-600" bg="bg-amber-50" />
          <StatCard title="مدراء الفروع" value={users.filter(u => u.role === "manager").length.toString()} icon={UserCog} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="أطقم الكاشير" value={users.filter(u => u.role === "cashier").length.toString()} icon={User} color="text-emerald-600" bg="bg-emerald-50" />
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const config = roleConfig[user.role];
            const RoleIcon = config.icon;
            return (
              <div
                key={user.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center border shadow-sm`}>
                      <RoleIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
                      <p className="text-[13px] font-bold text-slate-400 mt-0.5">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(user)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[12px] px-3 py-1.5 rounded-lg border ${config.color} font-bold shadow-sm`}>
                    {config.label}
                  </span>
                  <span className="text-[12px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    انضم: {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">{config.desc}</p>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {permissions[user.role].slice(0, 2).map((perm, i) => (
                      <span key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <perm.icon className="w-3.5 h-3.5 text-slate-400" />
                        {perm.text}
                      </span>
                    ))}
                    {permissions[user.role].length > 2 && (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center">
                        +{permissions[user.role].length - 2} المزيد
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">
                {editingUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    className="input font-bold"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم الدخول (Username) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="مثال: ahmed123"
                    className="input font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {editingUser ? "كلمة المرور (اتركها فارغة للاحتفاظ بالقديمة)" : "كلمة المرور السريّة *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input font-mono text-lg tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">الصلاحية الوظيفية <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                    const cfg = roleConfig[role];
                    const RoleIcon = cfg.icon;
                    const isSelected = form.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setForm({ ...form, role })}
                        className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <RoleIcon className={`w-8 h-8 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                        <div className="text-[15px] font-bold">{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-[13px] font-bold text-slate-400 mb-4 uppercase tracking-wide">الصلاحيات الممنوحة لهذا الدور:</h4>
                <div className="space-y-3">
                  {permissions[form.role].map((perm, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <perm.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900">{perm.text}</div>
                        <div className="text-[12px] font-medium text-slate-500">{perm.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] flex items-center justify-center gap-2 text-lg"
                >
                  <Save className="w-5 h-5" />
                  {editingUser ? "تأكيد التعديلات" : "إضافة المستخدم للنظام"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: string; icon: any; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="text-[15px] font-bold text-slate-500">{title}</div>
      </div>
      <div className="text-3xl font-black text-slate-900 pr-2">{value}</div>
    </div>
  );
}