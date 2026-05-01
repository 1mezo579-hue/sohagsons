"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowRight, Plus, Contact, Search, Phone, FileText, ChevronDown, Package, X } from "lucide-react";

interface Trader {
  id: number;
  name: string;
  phone: string | null;
  company: string | null;
  balance: number;
}

interface Product {
  id: number;
  name: string;
  costPrice: number;
}

export default function TradersPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager"]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showTraderForm, setShowTraderForm] = useState(false);
  const [traderForm, setTraderForm] = useState({ name: "", phone: "", company: "", address: "", notes: "" });
  
  const [showInvoiceModal, setShowInvoiceModal] = useState<Trader | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({ total: "", paid: "", notes: "" });
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    fetchTraders();
    fetchProducts();
  }, []);

  const fetchTraders = async () => {
    try {
      const res = await fetch("/api/traders");
      const data = await res.json();
      setTraders(Array.isArray(data) ? data : []);
    } catch { toast.error("فشل تحميل الموردين"); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { console.error("Failed to load products"); }
  };

  const saveTrader = async () => {
    if (!traderForm.name) return toast.error("اسم التاجر مطلوب");
    try {
      const res = await fetch("/api/traders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(traderForm),
      });
      if (!res.ok) throw new Error();
      toast.success("تمت إضافة التاجر");
      setShowTraderForm(false);
      setTraderForm({ name: "", phone: "", company: "", address: "", notes: "" });
      fetchTraders();
    } catch { toast.error("فشل إضافة التاجر"); }
  };

  const addInvoiceItem = () => {
    if (!selectedProduct) return;
    const p = products.find(x => x.id.toString() === selectedProduct);
    if (!p) return;
    
    setInvoiceItems([...invoiceItems, { 
      productId: p.id, 
      name: p.name, 
      description: p.name,
      quantity: 1, 
      price: p.costPrice, 
      total: p.costPrice 
    }]);
    setSelectedProduct("");
  };

  const updateItem = (index: number, field: string, value: string) => {
    const num = parseFloat(value) || 0;
    const newItems = [...invoiceItems];
    newItems[index][field] = num;
    if (field === "quantity" || field === "price") {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setInvoiceItems(newItems);
  };

  const saveInvoice = async () => {
    if (!showInvoiceModal) return;
    const totalAmount = parseFloat(invoiceForm.total) || 0;
    const paidAmount = parseFloat(invoiceForm.paid) || 0;
    
    if (totalAmount <= 0) return toast.error("يجب إدخال إجمالي الفاتورة");

    try {
      const res = await fetch("/api/traders/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traderId: showInvoiceModal.id,
          total: totalAmount,
          paid: paidAmount,
          notes: invoiceForm.notes,
          items: invoiceItems,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("تم تسجيل الفاتورة بنجاح وتحديث الرصيد والمخزون");
      setShowInvoiceModal(null);
      setInvoiceItems([]);
      setInvoiceForm({ total: "", paid: "", notes: "" });
      fetchTraders(); // Refresh balances
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الفاتورة");
    }
  };

  if (!isChecked) return null;

  const filtered = traders.filter(t => t.name.includes(searchQuery) || (t.company && t.company.includes(searchQuery)));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-slate-200">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-800/20">
              <Contact className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">التجار والموردين</h1>
              <p className="text-sm text-slate-500 font-medium">إدارة الحسابات والفواتير</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowTraderForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-sm font-bold">
          <Plus className="w-5 h-5" />
          تاجر جديد
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-md">
          <input type="text" placeholder="بحث باسم التاجر أو الشركة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-slate-500 outline-none shadow-sm" />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{t.name}</h3>
                  {t.company && <div className="text-sm font-bold text-slate-500 mt-1">{t.company}</div>}
                </div>
              </div>
              
              <div className={`mt-4 p-4 rounded-xl border ${t.balance > 0 ? 'bg-rose-50 border-rose-100' : t.balance < 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="text-sm font-bold mb-1">{t.balance > 0 ? "عليه لنا (دائن)" : t.balance < 0 ? "له عندنا (مدين)" : "الرصيد مصفر"}</div>
                <div className={`text-2xl font-black ${t.balance > 0 ? 'text-rose-600' : t.balance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatPrice(Math.abs(t.balance))}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => setShowInvoiceModal(t)} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors">
                  <FileText className="w-4 h-4" /> إضافة فاتورة
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">فاتورة مشتريات جديدة</h2>
                <p className="text-slate-500 text-sm mt-1">التاجر: <span className="font-bold text-slate-700">{showInvoiceModal.name}</span></p>
              </div>
              <button onClick={() => {setShowInvoiceModal(null); setInvoiceItems([]);}} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">إضافة منتج للفاتورة (لتحديث المخزون تلقائياً)</label>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-500 outline-none">
                    <option value="">-- اختر منتج --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <button onClick={addInvoiceItem} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4" /> إضافة
                </button>
              </div>

              {/* Items Table */}
              {invoiceItems.length > 0 && (
                <table className="w-full text-right border border-slate-200 rounded-xl overflow-hidden block">
                  <thead className="bg-slate-50 border-b border-slate-200 block">
                    <tr className="flex w-full">
                      <th className="p-3 w-1/3 font-bold text-slate-600">المنتج</th>
                      <th className="p-3 w-1/6 font-bold text-slate-600">الكمية</th>
                      <th className="p-3 w-1/6 font-bold text-slate-600">سعر الوحدة</th>
                      <th className="p-3 w-1/6 font-bold text-slate-600">الإجمالي</th>
                      <th className="p-3 w-1/6"></th>
                    </tr>
                  </thead>
                  <tbody className="block max-h-48 overflow-y-auto w-full">
                    {invoiceItems.map((item, i) => (
                      <tr key={i} className="flex w-full border-b border-slate-100 items-center">
                        <td className="p-3 w-1/3 font-bold">{item.name}</td>
                        <td className="p-3 w-1/6"><input type="number" value={item.quantity} onChange={e=>updateItem(i, "quantity", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-3 w-1/6"><input type="number" value={item.price} onChange={e=>updateItem(i, "price", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-3 w-1/6 font-black text-slate-700">{formatPrice(item.total)}</td>
                        <td className="p-3 w-1/6 text-left"><button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700 text-sm font-bold">حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Invoice Totals Form */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">إجمالي الفاتورة (المطلوب)</label>
                  <input type="number" value={invoiceForm.total} onChange={e => setInvoiceForm({...invoiceForm, total: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-black focus:ring-2 focus:ring-slate-500 outline-none text-left" dir="ltr" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المدفوع نقداً للتاجر</label>
                  <input type="number" value={invoiceForm.paid} onChange={e => setInvoiceForm({...invoiceForm, paid: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-emerald-600 focus:ring-2 focus:ring-slate-500 outline-none text-left" dir="ltr" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات / رقم الفاتورة الورقية</label>
                <input type="text" value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-500 outline-none" />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3 justify-between items-center">
              <div className="text-sm font-bold text-slate-500">
                المتبقي (سيضاف للرصيد): <span className="text-lg text-rose-600">{formatPrice(Math.max(0, (parseFloat(invoiceForm.total)||0) - (parseFloat(invoiceForm.paid)||0)))}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {setShowInvoiceModal(null); setInvoiceItems([]);}} className="px-6 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
                <button onClick={saveInvoice} className="px-8 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold transition-colors">حفظ الفاتورة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Trader Form Modal */}
      {showTraderForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">إضافة تاجر جديد</h2>
              <button onClick={() => setShowTraderForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="اسم التاجر أو المندوب *" value={traderForm.name} onChange={e => setTraderForm({...traderForm, name: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
              <input type="text" placeholder="اسم الشركة (اختياري)" value={traderForm.company} onChange={e => setTraderForm({...traderForm, company: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
              <input type="tel" placeholder="رقم التليفون" value={traderForm.phone} onChange={e => setTraderForm({...traderForm, phone: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={saveTrader} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
