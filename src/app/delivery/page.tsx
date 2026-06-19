"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatPrice } from "@/lib/utils";
import { printReceipt, toReceiptInvoice } from "@/lib/receiptPrint";
import toast from "react-hot-toast";
import {
  ArrowRight, Truck, Phone, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, ShoppingBag, Printer, Search,
  ChevronDown, ChevronUp, Bike, Check
} from "lucide-react";

interface InvoiceItem {
  id: number;
  quantity: number;
  price: number;
  total: number;
  product: {
    name: string;
    unit: string;
  };
}

interface Invoice {
  id: number;
  invoiceNo: string;
  total: number;
  discount: number;
  finalTotal: number;
  paymentType: string;
  orderType: string;
  deliveryFee: number;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
    address: string | null;
  } | null;
  items: InvoiceItem[];
}

export default function DeliveryPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager", "cashier"]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "shipping" | "delivered" | "collected">("all");
  const [statuses, setStatuses] = useState<Record<number, "pending" | "shipping" | "delivered" | "collected">>({});
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States for rider changes and printing states
  const [riderChanges, setRiderChanges] = useState<Record<number, string>>({});
  const [printingIds, setPrintingIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const deliveryOnly = list.filter((inv: any) => inv.orderType === "delivery");
        setInvoices(deliveryOnly);

        // Load statuses and rider changes from localStorage
        const storedStatuses: Record<number, any> = {};
        const storedChanges: Record<number, string> = {};
        deliveryOnly.forEach((inv: Invoice) => {
          const status = localStorage.getItem(`delivery_status_${inv.id}`);
          storedStatuses[inv.id] = status || "pending"; // Default to pending
          
          const change = localStorage.getItem(`delivery_change_${inv.id}`);
          storedChanges[inv.id] = change || "";
        });
        setStatuses(storedStatuses);
        setRiderChanges(storedChanges);
      } else {
        toast.error("فشل في تحميل الطلبات");
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (invoiceId: number, newStatus: "pending" | "shipping" | "delivered" | "collected") => {
    localStorage.setItem(`delivery_status_${invoiceId}`, newStatus);
    setStatuses(prev => ({ ...prev, [invoiceId]: newStatus }));
    toast.success("تم تحديث حالة الطلب بنجاح");
  };

  const updateRiderChange = (invoiceId: number, value: string) => {
    localStorage.setItem(`delivery_change_${invoiceId}`, value);
    setRiderChanges(prev => ({ ...prev, [invoiceId]: value }));
  };

  const printOrder = async (invoice: Invoice) => {
    setPrintingIds(prev => ({ ...prev, [invoice.id]: true }));
    const riderChangeVal = parseFloat(riderChanges[invoice.id] || "0");
    const receipt = toReceiptInvoice(invoice, { riderChange: riderChangeVal });

    try {
      toast.loading("جاري الطباعة...", { id: `print-${invoice.id}` });
      await printReceipt(receipt);
      toast.success("تم إرسال الفاتورة للطابعة بنجاح 🎉", { id: `print-${invoice.id}` });
    } catch (error: any) {
      toast.error(error?.message || "فشل في الطباعة", { id: `print-${invoice.id}` });
    } finally {
      setPrintingIds(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const customerName = inv.customer?.name?.toLowerCase() || "";
    const customerPhone = inv.customer?.phone || "";
    const invoiceNo = inv.invoiceNo.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = customerName.includes(query) || customerPhone.includes(query) || invoiceNo.includes(query);

    const status = statuses[inv.id] || "pending";
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && status === filterStatus;
  });

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-500/30">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-white/50 px-6 py-5 flex items-center justify-between sticky top-0 z-10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-5">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-md transition-all hover:scale-105 active:scale-95">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 animate-pulse" style={{ animationDuration: '3s' }}>
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 tracking-tight">طلبات الدليفري والتوصيل</h1>
              <p className="text-sm font-bold text-slate-500 tracking-wide mt-1">تتبع الحالات، عناوين العملاء، وطباعة فواتير التوصيل</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-sm font-black text-slate-700">دليفري نشط: {invoices.filter(inv => statuses[inv.id] !== "delivered").length}</span>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الفاتورة، اسم العميل أو الهاتف..."
              className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl pr-12 pl-4 py-3 font-bold outline-none transition-all text-sm"
            />
          </div>

          {/* Filter Status */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {[
              { key: "all", label: "الكل", count: invoices.length },
              { key: "pending", label: "قيد التحضير 📦", count: invoices.filter(inv => statuses[inv.id] === "pending").length },
              { key: "shipping", label: "خرج للتوصيل 🚴", count: invoices.filter(inv => statuses[inv.id] === "shipping").length },
              { key: "delivered", label: "تم التوصيل ✅", count: invoices.filter(inv => statuses[inv.id] === "delivered").length },
              { key: "collected", label: "تم التحصيل 💵", count: invoices.filter(inv => statuses[inv.id] === "collected").length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  filterStatus === tab.key
                    ? "bg-slate-900 text-white shadow-md shadow-slate-950/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-slate-400">جاري تحميل طلبات الدليفري...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 py-20 px-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Truck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-700">لا توجد طلبات دليفري حالياً</h3>
            <p className="text-slate-400 font-bold mt-2">
              {searchQuery ? "لم نجد نتائج مطابقة لبحثك." : "سيتم إدراج أي فواتير بيع من نوع دليفري هنا تلقائياً."}
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 gap-6">
            {filteredInvoices.map(invoice => {
              const status = statuses[invoice.id] || "pending";
              const isExpanded = expandedInvoice === invoice.id;

              return (
                <div
                  key={invoice.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${
                    status === "pending"
                      ? "border-amber-200 hover:border-amber-300 shadow-amber-500/[0.02]"
                      : status === "shipping"
                        ? "border-cyan-200 hover:border-cyan-300 shadow-cyan-500/[0.02]"
                        : status === "delivered"
                          ? "border-emerald-200 hover:border-emerald-300 shadow-emerald-500/[0.02]"
                          : "border-slate-200 opacity-65 hover:opacity-100 bg-slate-50/20"
                  }`}
                >
                  {/* Top Bar / Card Header */}
                  <div className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-lg">{invoice.invoiceNo}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : status === "shipping"
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                              : status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                        }`}>
                          {status === "pending" && "📦 قيد التحضير"}
                          {status === "shipping" && "🚴 خرج للتوصيل"}
                          {status === "delivered" && "✅ تم التوصيل"}
                          {status === "collected" && "💵 تم التحصيل"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(invoice.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(invoice.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
 
                    {/* Customer Info Card Snippet */}
                    <div className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-center w-full lg:w-auto border border-slate-100">
                      <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="text-right min-w-0">
                        <p className="font-black text-slate-950 truncate">{invoice.customer?.name || "زبون طياري"}</p>
                        <p className="text-xs font-bold text-slate-500 font-mono mt-0.5" dir="ltr">
                          {invoice.customer?.phone || "-"}
                        </p>
                      </div>
                    </div>
 
                    {/* Rider Change (الباقي مع الطيار) */}
                    <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100 flex flex-col items-end w-full lg:w-44 shadow-sm shrink-0">
                      <label className="text-[11px] font-black text-amber-800 mb-1 tracking-wide">الباقي مع الطيار (الفكة):</label>
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={riderChanges[invoice.id] || ""}
                          onChange={(e) => updateRiderChange(invoice.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white border border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-2.5 py-1.5 text-left font-mono font-bold text-slate-800 outline-none transition-all text-xs"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">ج.م</span>
                      </div>
                    </div>

                    {/* Pricing Snippet */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-400">الإجمالي المطلوب:</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{formatPrice(invoice.finalTotal)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        تشمل دليفري ({formatPrice(invoice.deliveryFee)})
                      </p>
                    </div>
 
                    {/* Quick Action Actions */}
                    <div className="flex gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => printOrder(invoice)}
                        disabled={printingIds[invoice.id]}
                        className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center ${
                          printingIds[invoice.id]
                            ? "bg-blue-50 text-blue-600 cursor-not-allowed"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                        title="طباعة إيصال التوصيل"
                      >
                        {printingIds[invoice.id] ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Printer className="w-5 h-5" />
                        )}
                      </button>
 
                      {/* Status quick cycle buttons */}
                      {status === "pending" && (
                        <button
                          onClick={() => updateStatus(invoice.id, "shipping")}
                          className="flex-1 lg:flex-none px-5 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
                        >
                          <Bike className="w-4 h-4" />
                          ارسل مع المندوب
                        </button>
                      )}
                      {status === "shipping" && (
                        <button
                          onClick={() => updateStatus(invoice.id, "delivered")}
                          className="flex-1 lg:flex-none px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          أكد التوصيل
                        </button>
                      )}
                      {status === "delivered" && (
                        <>
                          <button
                            onClick={() => updateStatus(invoice.id, "collected")}
                            className="flex-1 lg:flex-none px-5 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            تم التحصيل
                          </button>
                          <button
                            onClick={() => updateStatus(invoice.id, "pending")}
                            className="px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs transition-all"
                            title="إعادة تحضير"
                          >
                            إعادة
                          </button>
                        </>
                      )}
                      {status === "collected" && (
                        <button
                          onClick={() => updateStatus(invoice.id, "delivered")}
                          className="flex-1 lg:flex-none px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                        >
                          إلغاء التحصيل ↩️
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                        className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded / Items & Address Details */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Address & Contacts */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                          <h4 className="font-black text-slate-900 flex items-center gap-2 text-base pb-3 border-b border-slate-50">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            تفاصيل عنوان التوصيل
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-bold text-slate-400">العنوان المسجل للعميل:</span>
                              <p className="font-black text-slate-800 text-base mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {invoice.customer?.address || "⚠️ لا يوجد عنوان مسجل لهذا العميل، يرجى كتابته في بيانات العميل."}
                              </p>
                            </div>
                            {invoice.customer?.phone && (
                              <div className="pt-2">
                                <a
                                  href={`tel:${invoice.customer.phone}`}
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-black"
                                >
                                  📞 الاتصال الهاتفي بالعميل
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                          <h4 className="font-black text-slate-900 flex items-center gap-2 text-base pb-3 border-b border-slate-50">
                            <ShoppingBag className="w-5 h-5 text-emerald-500" />
                            محتويات الطلب ({invoice.items.length} أصناف)
                          </h4>
                          <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto pr-1">
                            {invoice.items.map(item => (
                              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                                <div>
                                  <p className="font-black text-slate-800">{item.product.name}</p>
                                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                                    {formatPrice(item.price)} × {item.quantity} {item.product.unit === "kg" ? "كجم" : "قطعة"}
                                  </p>
                                </div>
                                <span className="font-black text-slate-900">{formatPrice(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pricing Table Detail */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-wrap gap-6 justify-between items-center text-sm">
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <span className="text-slate-400 font-bold">المجموع الفرعي:</span>
                            <span className="font-black text-slate-800 mr-2">{formatPrice(invoice.total)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">رسوم التوصيل:</span>
                            <span className="font-black text-slate-800 mr-2">+{formatPrice(invoice.deliveryFee)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">الخصومات:</span>
                            <span className="font-black text-rose-600 mr-2">-{formatPrice(invoice.discount)}</span>
                          </div>
                          {riderChanges[invoice.id] && parseFloat(riderChanges[invoice.id]) > 0 && (
                            <div>
                              <span className="text-amber-600 font-black">الباقي مع الطيار:</span>
                              <span className="font-black text-amber-700 mr-2">{formatPrice(parseFloat(riderChanges[invoice.id]))}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900 text-lg">المبلغ المطلوب من العميل:</span>
                          <span className="text-xl font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                            {formatPrice(invoice.finalTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
