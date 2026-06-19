"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ArrowRight, Plus, Contact, Search, FileText, Package, X,
  Banknote, History, Phone, Building2
} from "lucide-react";

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

interface InvoiceItem {
  productId?: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface TraderInvoice {
  id: number;
  invoiceNo: string;
  total: number;
  paid: number;
  remaining: number;
  status: string;
  notes: string | null;
  createdAt: string;
  items: { description: string; quantity: number; price: number; total: number }[];
}

function balanceLabel(balance: number) {
  if (balance > 0) return { text: "له عندنا (مدين)", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" };
  if (balance < 0) return { text: "علينا له (دائن)", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" };
  return { text: "الرصيد مصفر", color: "text-slate-600", bg: "bg-slate-50 border-slate-100" };
}

export default function TradersPage() {
  const { isChecked } = useRequireAuth(["admin", "manager"]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [showTraderForm, setShowTraderForm] = useState(false);
  const [traderForm, setTraderForm] = useState({ name: "", phone: "", company: "", address: "", notes: "" });

  const [showInvoiceModal, setShowInvoiceModal] = useState<Trader | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({ total: "", paid: "", notes: "" });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [manualItem, setManualItem] = useState({ description: "", quantity: "1", price: "" });
  const [savingInvoice, setSavingInvoice] = useState(false);

  const [showPayModal, setShowPayModal] = useState<Trader | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState<Trader | null>(null);
  const [traderInvoices, setTraderInvoices] = useState<TraderInvoice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const itemsTotal = useMemo(
    () => invoiceItems.reduce((sum, item) => sum + item.total, 0),
    [invoiceItems]
  );

  useEffect(() => {
    fetchTraders();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (invoiceItems.length > 0) {
      setInvoiceForm((prev) => ({ ...prev, total: itemsTotal.toFixed(2) }));
    }
  }, [itemsTotal, invoiceItems.length]);

  const fetchTraders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/traders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTraders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("فشل تحميل بيانات التجار");
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to load products");
    }
  };

  const fetchTraderHistory = async (traderId: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/traders/invoices?traderId=${traderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTraderInvoices(Array.isArray(data) ? data : []);
    } catch {
      toast.error("فشل تحميل سجل الفواتير");
      setTraderInvoices([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveTrader = async () => {
    if (!traderForm.name.trim()) return toast.error("اسم التاجر مطلوب");
    try {
      const res = await fetch("/api/traders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(traderForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تمت إضافة التاجر");
      setShowTraderForm(false);
      setTraderForm({ name: "", phone: "", company: "", address: "", notes: "" });
      fetchTraders();
    } catch (e: any) {
      toast.error(e.message || "فشل إضافة التاجر");
    }
  };

  const addInvoiceItem = () => {
    if (!selectedProduct) return toast.error("اختر منتجاً أولاً");
    const p = products.find((x) => x.id.toString() === selectedProduct);
    if (!p) return;

    if (invoiceItems.some((i) => i.productId === p.id)) {
      return toast.error("المنتج مضاف بالفعل للفاتورة");
    }

    setInvoiceItems([
      ...invoiceItems,
      {
        productId: p.id,
        name: p.name,
        description: p.name,
        quantity: 1,
        price: p.costPrice,
        total: p.costPrice,
      },
    ]);
    setSelectedProduct("");
  };

  const addManualItem = () => {
    const qty = parseFloat(manualItem.quantity) || 0;
    const price = parseFloat(manualItem.price) || 0;
    if (!manualItem.description.trim()) return toast.error("أدخل وصف البند");
    if (qty <= 0 || price <= 0) return toast.error("الكمية والسعر يجب أن يكونا أكبر من صفر");

    setInvoiceItems([
      ...invoiceItems,
      {
        name: manualItem.description.trim(),
        description: manualItem.description.trim(),
        quantity: qty,
        price,
        total: qty * price,
      },
    ]);
    setManualItem({ description: "", quantity: "1", price: "" });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const num = parseFloat(value) || 0;
    const newItems = [...invoiceItems];
    (newItems[index] as any)[field] = num;
    if (field === "quantity" || field === "price") {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setInvoiceItems(newItems);
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(null);
    setInvoiceItems([]);
    setInvoiceForm({ total: "", paid: "", notes: "" });
    setManualItem({ description: "", quantity: "1", price: "" });
  };

  const saveInvoice = async () => {
    if (!showInvoiceModal) return;
    const totalAmount = parseFloat(invoiceForm.total) || itemsTotal;
    const paidAmount = parseFloat(invoiceForm.paid) || 0;

    if (totalAmount <= 0) return toast.error("يجب إدخال إجمالي الفاتورة");

    setSavingInvoice(true);
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("تم تسجيل الفاتورة وتحديث الرصيد والمخزون");
      closeInvoiceModal();
      fetchTraders();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء تسجيل الفاتورة");
    } finally {
      setSavingInvoice(false);
    }
  };

  const savePayment = async () => {
    if (!showPayModal) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return toast.error("أدخل مبلغ صحيح");

    setSavingPayment(true);
    try {
      const res = await fetch("/api/traders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: showPayModal.id, payment: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("تم تسجيل الدفعة بنجاح");
      setShowPayModal(null);
      setPayAmount("");
      fetchTraders();
    } catch (e: any) {
      toast.error(e.message || "فشل تسجيل الدفعة");
    } finally {
      setSavingPayment(false);
    }
  };

  const openHistory = (trader: Trader) => {
    setShowHistoryModal(trader);
    fetchTraderHistory(trader.id);
  };

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = traders.filter(
    (t) =>
      t.name.includes(searchQuery) ||
      (t.company && t.company.includes(searchQuery)) ||
      (t.phone && t.phone.includes(searchQuery))
  );

  const remainingPreview = Math.max(0, (parseFloat(invoiceForm.total) || itemsTotal) - (parseFloat(invoiceForm.paid) || 0));

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
              <p className="text-sm text-slate-500 font-medium">إدارة الحسابات وفواتير الشراء</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowTraderForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          تاجر جديد
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="بحث باسم التاجر أو الشركة أو التليفون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-slate-500 outline-none shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 font-bold">
            لا يوجد تجار مسجلون
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => {
              const bal = balanceLabel(t.balance);
              return (
                <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-slate-900">{t.name}</h3>
                    {t.company && (
                      <div className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {t.company}
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {t.phone}
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border ${bal.bg}`}>
                    <div className="text-sm font-bold mb-1">{bal.text}</div>
                    <div className={`text-2xl font-black ${bal.color}`}>{formatPrice(Math.abs(t.balance))}</div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setShowInvoiceModal(t)}
                      className="col-span-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors text-xs"
                    >
                      <FileText className="w-4 h-4" /> فاتورة
                    </button>
                    <button
                      onClick={() => { setShowPayModal(t); setPayAmount(""); }}
                      className="col-span-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl font-bold transition-colors text-xs"
                    >
                      <Banknote className="w-4 h-4" /> دفعة
                    </button>
                    <button
                      onClick={() => openHistory(t)}
                      className="col-span-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl font-bold transition-colors text-xs"
                    >
                      <History className="w-4 h-4" /> السجل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">فاتورة مشتريات جديدة</h2>
                <p className="text-slate-500 text-sm mt-1">
                  التاجر: <span className="font-bold text-slate-700">{showInvoiceModal.name}</span>
                </p>
              </div>
              <button onClick={closeInvoiceModal} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-bold text-slate-700 mb-2">إضافة منتج (يحدّث المخزون)</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-500 outline-none"
                  >
                    <option value="">-- اختر منتج --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={addInvoiceItem} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4" /> إضافة
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">بند يدوي (بدون مخزون)</label>
                  <input
                    type="text"
                    placeholder="وصف البند..."
                    value={manualItem.description}
                    onChange={(e) => setManualItem({ ...manualItem, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الكمية</label>
                  <input type="number" min="0" value={manualItem.quantity} onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">السعر</label>
                  <input type="number" min="0" value={manualItem.price} onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" dir="ltr" />
                </div>
                <button onClick={addManualItem} className="md:col-span-4 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-100">
                  + إضافة بند يدوي
                </button>
              </div>

              {invoiceItems.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold text-slate-600">البند</th>
                        <th className="p-3 font-bold text-slate-600">الكمية</th>
                        <th className="p-3 font-bold text-slate-600">السعر</th>
                        <th className="p-3 font-bold text-slate-600">الإجمالي</th>
                        <th className="p-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceItems.map((item, i) => (
                        <tr key={i}>
                          <td className="p-3 font-bold">{item.name}</td>
                          <td className="p-3">
                            <input type="number" min="0" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" dir="ltr" />
                          </td>
                          <td className="p-3">
                            <input type="number" min="0" value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} className="w-24 border rounded px-2 py-1" dir="ltr" />
                          </td>
                          <td className="p-3 font-black">{formatPrice(item.total)}</td>
                          <td className="p-3">
                            <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-xs font-bold">حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    إجمالي الفاتورة {invoiceItems.length > 0 && <span className="text-slate-400 font-normal">(يُحسب تلقائياً من البنود)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.total}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, total: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-black focus:ring-2 focus:ring-slate-500 outline-none text-left"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المدفوع نقداً للتاجر</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.paid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paid: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-emerald-600 focus:ring-2 focus:ring-slate-500 outline-none text-left"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات / رقم الفاتورة الورقية</label>
                <input
                  type="text"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3 justify-between items-center">
              <div className="text-sm font-bold text-slate-500">
                المتبقي (يُضاف للرصيد):{" "}
                <span className="text-lg text-rose-600">{formatPrice(remainingPreview)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={closeInvoiceModal} className="px-6 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={saveInvoice}
                  disabled={savingInvoice}
                  className="px-8 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  {savingInvoice ? "جاري الحفظ..." : "حفظ الفاتورة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> تسجيل دفعة
              </h2>
              <button onClick={() => setShowPayModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                دفعة للتاجر: <span className="font-bold text-slate-800">{showPayModal.name}</span>
              </p>
              <p className="text-sm font-bold text-slate-600">
                الرصيد الحالي: {balanceLabel(showPayModal.balance).text} — {formatPrice(Math.abs(showPayModal.balance))}
              </p>
              <input
                type="number"
                min="0"
                autoFocus
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="مبلغ الدفعة"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
              />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={savePayment} disabled={savingPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
                {savingPayment ? "جاري الحفظ..." : "تسجيل الدفعة"}
              </button>
              <button onClick={() => setShowPayModal(null)} className="px-6 bg-white border border-slate-200 py-3 rounded-xl font-bold">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold">سجل فواتير {showHistoryModal.name}</h2>
                <p className="text-sm text-slate-500 mt-1">آخر الفواتير المسجلة</p>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="p-2 text-slate-400 hover:bg-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : traderInvoices.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-12">لا توجد فواتير مسجلة</p>
              ) : (
                <div className="space-y-3">
                  {traderInvoices.map((inv) => (
                    <div key={inv.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-mono font-bold text-blue-600 text-sm">{inv.invoiceNo}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(inv.createdAt)}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          inv.status === "partial" ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>
                          {inv.status === "paid" ? "مدفوعة" : inv.status === "partial" ? "جزئية" : "معلقة"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-slate-400">الإجمالي:</span> <span className="font-bold">{formatPrice(inv.total)}</span></div>
                        <div><span className="text-slate-400">مدفوع:</span> <span className="font-bold text-emerald-600">{formatPrice(inv.paid)}</span></div>
                        <div><span className="text-slate-400">متبقي:</span> <span className="font-bold text-rose-600">{formatPrice(inv.remaining)}</span></div>
                      </div>
                      {inv.notes && <p className="text-xs text-slate-500 mt-2">{inv.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
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
              <button onClick={() => setShowTraderForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="اسم التاجر أو المندوب *" value={traderForm.name} onChange={(e) => setTraderForm({ ...traderForm, name: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
              <input type="text" placeholder="اسم الشركة (اختياري)" value={traderForm.company} onChange={(e) => setTraderForm({ ...traderForm, company: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
              <input type="tel" placeholder="رقم التليفون" value={traderForm.phone} onChange={(e) => setTraderForm({ ...traderForm, phone: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500" />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={saveTrader} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold">حفظ</button>
              <button onClick={() => setShowTraderForm(false)} className="px-6 bg-white border border-slate-200 py-3 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
