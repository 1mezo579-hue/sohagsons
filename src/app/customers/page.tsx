"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import toast from "react-hot-toast";
import { ArrowRight, Plus, Truck, Users, Star, Phone, Search, Trash2, Edit2, X, Save, Clock, Banknote, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  points: number;
  totalSpent: number;
  balance: number;
  notes: string | null;
}

export default function CustomersPage() {
  const { user, isChecked } = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

  const [showPayModal, setShowPayModal] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { toast.error("فشل تحميل بيانات العملاء"); }
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error("الاسم ورقم التليفون مطلوبان");
    
    try {
      const method = editingCustomer ? "PUT" : "POST";
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingCustomer ? "تم التعديل بنجاح" : "تمت إضافة العميل");
      setShowForm(false);
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تم الحذف");
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message || "فشل الحذف");
    }
  };

  const handlePay = async () => {
    if (!showPayModal) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return toast.error("أدخل مبلغ صحيح");
    
    try {
      const res = await fetch(`/api/customers/${showPayModal.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم سداد المبلغ بنجاح");
      setShowPayModal(null);
      setPayAmount("");
      fetchCustomers();
    } catch {
      toast.error("فشل في عملية السداد");
    }
  };

  const openForm = (c?: Customer) => {
    if (c) {
      setEditingCustomer(c);
      setForm({ name: c.name, phone: c.phone, address: c.address || "", notes: c.notes || "" });
    } else {
      setEditingCustomer(null);
      setForm({ name: "", phone: "", address: "", notes: "" });
    }
    setShowForm(true);
  };

  if (!isChecked) return null;

  const filtered = customers.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-200">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">العملاء والدليفري</h1>
              <p className="text-sm text-slate-500 font-medium">إدارة العملاء ونقاط الولاء</p>
            </div>
          </div>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm font-bold">
          <Plus className="w-5 h-5" />
          عميل جديد
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="بحث بالاسم أو التليفون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-mono">{c.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="space-y-3">
                {c.balance > 0 && (
                  <div className="bg-rose-50 rounded-xl p-3 flex justify-between items-center border border-rose-100 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span className="text-sm font-bold text-rose-900">عليه آجل (شكك)</span>
                    </div>
                    <span className="font-black text-rose-600">{formatPrice(c.balance)}</span>
                  </div>
                )}
                <div className="bg-indigo-50 rounded-xl p-3 flex justify-between items-center border border-indigo-100">
                  <span className="text-sm font-bold text-indigo-900">النقاط المكتسبة</span>
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    {c.points} <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-bold">العنوان:</span> {c.address || "غير مسجل"}
                </div>
                
                {c.balance > 0 && (
                  <button onClick={() => setShowPayModal(c)} className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Banknote className="w-4 h-4" /> سداد دفعة من الحساب
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم التليفون (للبحث والدليفري)</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان التوصيل</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"><Save className="w-5 h-5" /> حفظ البيانات</button>
              <button onClick={() => setShowForm(false)} className="px-6 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h2 className="text-xl font-bold text-rose-900">سداد مديونية العميل</h2>
                <p className="text-sm text-rose-700 mt-1">{showPayModal.name}</p>
              </div>
              <button onClick={() => setShowPayModal(null)} className="p-2 text-rose-400 hover:bg-white rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div className="text-sm font-bold text-slate-500">المديونية الحالية</div>
              <div className="text-3xl font-black text-rose-600 mb-4">{formatPrice(showPayModal.balance)}</div>
              
              <div className="text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ المراد سداده الآن</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black focus:ring-2 focus:ring-rose-500 outline-none text-left" 
                  dir="ltr"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={handlePay} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"><Check className="w-5 h-5" /> تأكيد السداد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
