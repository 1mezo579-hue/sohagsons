"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ArrowRight, TrendingUp, TrendingDown, Calendar,
  DollarSign, Package, ShoppingCart, Users, Clock,
  BarChart3, PieChart, Activity, Layers, Eye, X, Printer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line
} from "recharts";

interface Invoice {
  id: number;
  invoiceNo: string;
  total: number;
  discount: number;
  finalTotal: number;
  paymentType: string;
  createdAt: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    total: number;
    product: { name: string; costPrice: number; category: { name: string } };
  }[];
  user: { name: string };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function ReportsPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager"]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().split("T")[0]);
  const [customTo, setCustomTo] = useState(new Date().toISOString().split("T")[0]);
  const [activeView, setActiveView] = useState<"overview" | "invoices" | "products" | "analytics">("overview");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {}
  };

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    return invoices.filter((inv) => {
      const date = new Date(inv.createdAt).toISOString().split("T")[0];

      if (dateRange === "today") return date === today;
      if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        return date >= weekAgo;
      }
      if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        return date >= monthAgo;
      }
      return date >= customFrom && date <= customTo;
    });
  }, [invoices, dateRange, customFrom, customTo]);

  const stats = useMemo(() => {
    const totalSales = filteredInvoices.reduce((s, i) => s + i.finalTotal, 0);
    const totalDiscount = filteredInvoices.reduce((s, i) => s + i.discount, 0);
    const totalInvoices = filteredInvoices.length;
    const avgInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    const totalItems = filteredInvoices.reduce((s, i) => s + i.items.length, 0);

    const totalCost = filteredInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((itemSum, item) => {
        return itemSum + item.quantity * item.product.costPrice;
      }, 0);
    }, 0);
    const profit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    const cashSales = filteredInvoices.filter(i => i.paymentType === "cash").reduce((s, i) => s + i.finalTotal, 0);
    const cardSales = filteredInvoices.filter(i => i.paymentType === "card").reduce((s, i) => s + i.finalTotal, 0);

    return { totalSales, totalDiscount, totalInvoices, avgInvoice, totalItems, profit, profitMargin, cashSales, cardSales, totalCost };
  }, [filteredInvoices]);

  const hourlyData = useMemo(() => {
    const hours: Record<number, { hour: string; sales: number; count: number }> = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = { hour: `${i}:00`, sales: 0, count: 0 };
    }
    filteredInvoices.forEach((inv) => {
      const h = new Date(inv.createdAt).getHours();
      hours[h].sales += inv.finalTotal;
      hours[h].count += 1;
    });
    return Object.values(hours);
  }, [filteredInvoices]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cat = item.product.category?.name || "غير مصنف";
        cats[cat] = (cats[cat] || 0) + item.total;
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredInvoices]);

  const topProducts = useMemo(() => {
    const products: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!products[item.product.name]) {
          products[item.product.name] = { name: item.product.name, qty: 0, revenue: 0, profit: 0 };
        }
        products[item.product.name].qty += item.quantity;
        products[item.product.name].revenue += item.total;
        products[item.product.name].profit += item.total - (item.quantity * item.product.costPrice);
      });
    });
    return Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredInvoices]);

  const paymentData = [
    { name: "كاش", value: stats.cashSales, color: "#10b981" },
    { name: "فيزا", value: stats.cardSales, color: "#3b82f6" },
  ];

  const dateLabel = {
    today: "مبيعات اليوم",
    week: "آخر 7 أيام",
    month: "آخر 30 يوم",
    custom: "فترة مخصصة",
  };

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-amber-200">
      {/* Header */}
      <header className={`bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm ${selectedInvoice ? 'no-print' : ''}`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">التقارير والإحصائيات</h1>
              <p className="text-sm text-slate-500 font-medium">نظرة شاملة على أداء المتجر</p>
            </div>
          </div>
        </div>

        {/* Date Filter & User */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden md:flex flex-col items-end px-2">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role === "admin" ? "مدير" : "كاشير"}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-sm">
            {(["today", "week", "month", "custom"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                  dateRange === range
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {dateLabel[range]}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20 no-print"
          >
            طباعة التقرير
          </button>
        </div>
      </header>

      {dateRange === "custom" && (
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4 animate-fade-in shadow-sm no-print">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-slate-600">من تاريخ:</span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="input w-auto text-sm bg-slate-50"
          />
          <span className="text-sm font-bold text-slate-600 md:mr-4">إلى تاريخ:</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="input w-auto text-sm bg-slate-50"
          />
        </div>
      )}

      <div className={`p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fade-in ${selectedInvoice ? 'no-print' : ''}`}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <KpiCard title="إجمالي المبيعات" value={formatPrice(stats.totalSales)} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
          <KpiCard title="صافي الأرباح" value={formatPrice(stats.profit)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" sub={`${stats.profitMargin.toFixed(1)}% هامش الربح`} />
          <KpiCard title="عدد الفواتير" value={stats.totalInvoices.toString()} icon={ShoppingCart} color="text-amber-600" bg="bg-amber-50" sub={`متوسط الفاتورة: ${formatPrice(stats.avgInvoice)}`} />
          <KpiCard title="إجمالي الخصومات" value={formatPrice(stats.totalDiscount)} icon={TrendingDown} color="text-rose-600" bg="bg-rose-50" />
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3 no-print">
          {[
            { key: "overview", label: "نظرة عامة", icon: PieChart },
            { key: "invoices", label: "سجل الفواتير", icon: ShoppingCart },
            { key: "products", label: "أداء المنتجات", icon: Package },
            { key: "analytics", label: "تحليلات متقدمة", icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-[15px] font-bold transition-all shadow-sm border ${
                activeView === tab.key
                  ? "bg-amber-500 text-white border-amber-500 shadow-[0_4px_14px_0_rgba(245,158,11,0.39)]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeView === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Sales Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">حركة المبيعات بالساعة</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">توزيع المبيعات على مدار اليوم</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `£${val}`} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#0f172a", fontWeight: "bold", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: number) => formatPrice(value)}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#salesGradient)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">طرق الدفع</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">توزيع كاش وفيزا</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#0f172a", fontWeight: "bold", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        formatter={(value: number) => formatPrice(value)}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
                  {paymentData.map((item) => (
                    <div key={item.name} className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: item.color }}></div>
                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">{formatPrice(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categories Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">المبيعات حسب القسم</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">توزيع الإيرادات على الأقسام</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#475569" fontSize={13} fontWeight="bold" width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#0f172a", fontWeight: "bold", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: number) => formatPrice(value)}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">أكثر المنتجات مبيعاً</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">ترتيب حسب الإيرادات</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${
                        i === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                        i === 1 ? "bg-slate-200 text-slate-600 border border-slate-300" :
                        i === 2 ? "bg-orange-100 text-orange-600 border border-orange-200" :
                        "bg-white text-slate-400 border border-slate-200"
                      }`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px] text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">{p.qty.toFixed(2)} وحدة مباعة</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[15px] text-emerald-600">{formatPrice(p.revenue)}</div>
                        <div className="text-xs font-bold text-slate-400 mt-0.5">ربح: {formatPrice(p.profit)}</div>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-bold">لا توجد بيانات متاحة في هذه الفترة</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES */}
        {activeView === "invoices" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">سجل الفواتير</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">تم العثور على {filteredInvoices.length} فاتورة</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-500 font-bold">
                    <th className="py-4 px-6">رقم الفاتورة</th>
                    <th className="py-4 px-6">التاريخ والوقت</th>
                    <th className="py-4 px-6">الكاشير</th>
                    <th className="py-4 px-6">المجموع</th>
                    <th className="py-4 px-6">الخصم</th>
                    <th className="py-4 px-6">الإجمالي النهائي</th>
                    <th className="py-4 px-6">طريقة الدفع</th>
                    <th className="py-4 px-6">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-[13px] font-bold text-blue-600">{inv.invoiceNo}</td>
                      <td className="py-4 px-6 text-slate-500 text-[13px] font-medium">{formatDate(inv.createdAt)}</td>
                      <td className="py-4 px-6 font-bold text-slate-700">{inv.user?.name || "-"}</td>
                      <td className="py-4 px-6 font-bold text-slate-500">{formatPrice(inv.total)}</td>
                      <td className="py-4 px-6 font-bold text-rose-500">{formatPrice(inv.discount)}</td>
                      <td className="py-4 px-6 font-black text-[15px] text-emerald-600">{formatPrice(inv.finalTotal)}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border ${
                          inv.paymentType === "cash"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {inv.paymentType === "cash" ? "كاش" : "فيزا"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button onClick={() => setSelectedInvoice(inv)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm" title="عرض تفاصيل الفاتورة">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20 text-slate-900" />
                  <p className="font-bold text-lg text-slate-500">لا توجد فواتير</p>
                  <p className="text-sm mt-1">لم يتم العثور على فواتير في هذه الفترة المحددة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {activeView === "products" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-6">تفاصيل أداء المنتجات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <span className="font-bold text-[16px] text-slate-900">{p.name}</span>
                    <span className="text-[13px] font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      المركز #{i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="text-xl font-black text-slate-900">{p.qty.toFixed(2)}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">وحدة مباعة</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="text-xl font-black text-emerald-600">{formatPrice(p.revenue)}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">إجمالي الإيراد</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="text-xl font-black text-amber-600">{formatPrice(p.profit)}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">صافي الربح</div>
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="col-span-2 text-center py-20 text-slate-400 font-bold text-lg">لا توجد بيانات لعرض أداء المنتجات</div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeView === "analytics" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">المبيعات والخصومات لأحدث الفواتير</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={filteredInvoices.slice(0, 15).map((inv, i) => ({
                    name: `فاتورة ${i + 1}`,
                    sales: inv.finalTotal,
                    discount: inv.discount,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#0f172a", fontWeight: "bold", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="sales" name="المبيعات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="discount" name="الخصومات" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">الإيراد والربح لكل فاتورة</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={filteredInvoices.slice(0, 15).map((inv, i) => {
                    const cost = inv.items.reduce((s, item) => s + item.quantity * item.product.costPrice, 0);
                    return {
                      name: `فاتورة ${i + 1}`,
                      profit: inv.finalTotal - cost,
                      revenue: inv.finalTotal,
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", color: "#0f172a", fontWeight: "bold", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" name="الربح" dataKey="profit" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" name="الإيراد" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
              <div>
                <h3 className="font-black text-xl text-slate-900">تفاصيل الفاتورة <span className="text-blue-600">{selectedInvoice.invoiceNo}</span></h3>
                <p className="text-sm font-bold text-slate-500 mt-1">{formatDate(selectedInvoice.createdAt)} • الكاشير: {selectedInvoice.user?.name || "-"}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Print Header (Only visible during print) */}
            <div className="hidden print:block text-center mb-4 border-b-2 border-dashed border-gray-200 pb-4 pt-4">
              <h2 className="text-2xl font-black text-gray-900">أبناء سوهاج</h2>

              <div className="flex flex-col items-center gap-1 my-3 text-[13px] font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span dir="ltr">035551771</span>
                  <span>-</span>
                  <span dir="ltr">01224163621</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span dir="ltr">01211469399</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-1">نسخة من فاتورة مبيعات</p>
              <p className="text-xs text-gray-400 font-mono">{selectedInvoice.invoiceNo}</p>
              <p className="text-xs text-gray-400 mb-2">
                {new Date(selectedInvoice.createdAt).toLocaleString("ar-EG")}
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-500 font-bold">
                    <th className="py-3 px-4">المنتج</th>
                    <th className="py-3 px-4 no-print">القسم</th>
                    <th className="py-3 px-4 text-center">الكمية</th>
                    <th className="py-3 px-4">سعر الوحدة</th>
                    <th className="py-3 px-4">الإجمالي</th>
                    <th className="py-3 px-4 text-emerald-600 no-print">الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item) => {
                    const profit = item.total - (item.quantity * (item.product.costPrice || 0));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.product.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium no-print">{item.product.category?.name || "-"}</td>
                        <td className="py-3 px-4 text-center font-black text-slate-700">{item.quantity}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">{formatPrice(item.price)}</td>
                        <td className="py-3 px-4 font-black text-blue-600">{formatPrice(item.total)}</td>
                        <td className="py-3 px-4 font-black text-emerald-600 no-print">{formatPrice(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex-1 min-w-[150px]">
                  <div className="text-xs font-bold text-slate-400 mb-1">المجموع</div>
                  <div className="text-lg font-black text-slate-700">{formatPrice(selectedInvoice.total)}</div>
                </div>
                <div className="bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 shadow-sm flex-1 min-w-[150px]">
                  <div className="text-xs font-bold text-rose-400 mb-1">الخصم</div>
                  <div className="text-lg font-black text-rose-600">-{formatPrice(selectedInvoice.discount)}</div>
                </div>
                <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-200 shadow-sm flex-[2] min-w-[200px]">
                  <div className="text-xs font-bold text-blue-500 mb-1">الإجمالي النهائي</div>
                  <div className="text-xl font-black text-blue-700">{formatPrice(selectedInvoice.finalTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg, sub }: { title: string; value: string; icon: any; color: string; bg: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="text-[15px] font-bold text-slate-500">{title}</div>
      </div>
      <div className="text-3xl font-black text-slate-900 pr-2">{value}</div>
      {sub && <div className="text-[12px] font-bold text-slate-400 mt-3 pr-2 bg-slate-50 rounded-lg py-1 px-2 inline-block border border-slate-100">{sub}</div>}
    </div>
  );
}