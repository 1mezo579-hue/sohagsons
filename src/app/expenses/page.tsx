"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowRight, Plus, Wallet, Search, Trash2, Tag, Calendar, Banknote, X } from "lucide-react";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  createdAt: string;
  user: { name: string };
}

const EXPENSE_CATEGORIES = ["إيجار", "كهرباء/مياه", "رواتب", "مشتريات نثرية", "صيانة", "نقل وتوصيل", "أخرى"];

export default function ExpensesPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager"]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "أخرى", description: "" });
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch { toast.error("فشل تحميل بيانات المصروفات"); }
  };

  const handleSave = async () => {
    if (!form.amount || !form.category) return toast.error("المبلغ والتصنيف مطلوبان");
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) return toast.error("المبلغ غير صحيح");
    
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user?.id }),
      });

      if (!res.ok) throw new Error();

      toast.success("تم تسجيل المصروف بنجاح");
      setShowForm(false);
      setForm({ amount: "", category: "أخرى", description: "" });
      fetchExpenses();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المصروف؟ (تراجع عن العملية)")) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم الحذف");
      fetchExpenses();
    } catch { toast.error("فشل الحذف"); }
  };

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = expenses.filter(e => 
    e.category.includes(searchQuery) || (e.description && e.description.includes(searchQuery))
  );

  const totalExpenses = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const getLocalDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateHeading = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group by local date key
  const groups: Record<string, Expense[]> = {};
  filtered.forEach(e => {
    const key = getLocalDateString(e.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-red-200">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">سجل المصروفات</h1>
              <p className="text-sm text-slate-500 font-medium">متابعة دقيقة لكل جنيه يُصرف</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm font-bold">
          <Plus className="w-5 h-5" />
          تسجيل مصروف
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="بحث في المصروفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-red-500 outline-none shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <span className="font-bold text-slate-500">إجمالي المعروض:</span>
            <span className="text-2xl font-black text-rose-600">{formatPrice(totalExpenses)}</span>
          </div>
        </div>

        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dayExpenses = groups[dateKey];
            const dayTotal = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
            const isExpanded = !!expandedDays[dateKey];
            return (
              <div key={dateKey} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                {/* Day Header - Clickable Accordion */}
                <div 
                  onClick={() => toggleDay(dateKey)}
                  className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-100/70 active:bg-slate-100 transition-all select-none"
                >
                  <div className="flex items-center gap-3 font-black text-slate-900 text-base sm:text-lg">
                    <Calendar className="w-5.5 h-5.5 text-red-500 shrink-0" />
                    <span>{formatDateHeading(dateKey)}</span>
                    <span className="bg-slate-200/70 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold mr-2">
                      {dayExpenses.length} {dayExpenses.length === 1 ? "مصروف" : "مصروفات"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">إجمالي اليوم:</span>
                      <span className="bg-red-50 border border-red-100 text-rose-600 px-3.5 py-1.5 rounded-xl font-black text-base">
                        {formatPrice(dayTotal)}
                      </span>
                    </div>
                    {/* Collapsible arrow indicator */}
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-transform">
                      <span className={`text-xs transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Table */}
                {isExpanded && (
                  <div className="overflow-x-auto border-t border-slate-100 animate-fade-in">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider bg-slate-50/30">
                          <th className="px-6 py-3">الوقت</th>
                          <th className="px-6 py-3">التصنيف</th>
                          <th className="px-6 py-3">البيان/الوصف</th>
                          <th className="px-6 py-3">المبلغ</th>
                          <th className="px-6 py-3">بواسطة</th>
                          <th className="px-6 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dayExpenses.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-slate-500">
                              {new Date(e.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                                <Tag className="w-3 h-3" />
                                {e.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{e.description || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="font-black text-rose-600 text-base">
                                {formatPrice(e.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{e.user.name}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleDelete(e.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 py-12 px-6 text-center text-slate-400 font-bold">
              لا توجد مصروفات مسجلة
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><Banknote className="w-6 h-6 text-red-500"/> إضافة مصروف جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ (ج.م)</label>
                <input type="number" min="0" step="0.5" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-rose-600 focus:ring-2 focus:ring-red-500 outline-none text-left font-mono" dir="ltr" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm({...form, category: cat})}
                      className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                        form.category === cat 
                        ? "bg-red-50 border-red-200 text-red-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">البيان / تفاصيل المصروف</label>
                <input type="text" placeholder="مثال: فاتورة كهرباء شهر 10..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors">حفظ المصروف</button>
              <button onClick={() => setShowForm(false)} className="px-6 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
