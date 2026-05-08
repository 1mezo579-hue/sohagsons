"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  ArrowRight, Plus, Package, AlertTriangle, Search,
  TrendingUp, TrendingDown, Edit2, Trash2, X, Save,
  Boxes, Layers, Download, Upload, Trash
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  priceType: string;
  unit: string;
  category: { id: number; name: string };
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  _count: { products: number };
}

export default function InventoryPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "stock" | "categories">("products");
  
  // Modals state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockForm, setShowStockForm] = useState(false);
  
  // Forms state
  const [productForm, setProductForm] = useState({
    name: "", barcode: "", categoryId: "", priceType: "unit" as "unit" | "weight",
    price: "", costPrice: "", stock: "", minStock: "5", unit: "piece",
  });
  const [stockForm, setStockForm] = useState({
    productId: "", type: "in" as "in" | "out", quantity: "", reason: "purchase", notes: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/categories"),
      ]);
      const pData = await productsRes.json();
      const cData = await categoriesRes.json();
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch { toast.error("حدث خطأ أثناء تحميل البيانات"); }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.categoryId || !productForm.price) {
      toast.error("يرجى ملء جميع الحقول المطلوبة"); return;
    }
    const data = {
      name: productForm.name, barcode: productForm.barcode || null,
      categoryId: parseInt(productForm.categoryId), priceType: productForm.priceType,
      price: parseFloat(productForm.price), costPrice: parseFloat(productForm.costPrice) || 0,
      stock: parseFloat(productForm.stock) || 0, minStock: parseFloat(productForm.minStock) || 5,
      unit: productForm.unit,
    };
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) {
        toast.success(editingProduct ? "تم تحديث المنتج" : "تمت إضافة المنتج بنجاح");
        setShowProductForm(false); setEditingProduct(null); resetProductForm(); fetchData();
      } else { const err = await res.json(); toast.error(err.error || "فشل الحفظ"); }
    } catch { toast.error("خطأ في الاتصال بالسيرفر"); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("تم حذف المنتج"); fetchData(); }
    } catch { toast.error("فشل الحذف"); }
  };

  const handleDeleteAll = async () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    const input = prompt(`تحذير خطير: سيتم مسح جميع المنتجات والحركات المخزنية للأبد! \n\nلتأكيد المسح، يرجى كتابة الرقم التالي: ${code}`);
    if (input !== code.toString()) {
      if (input !== null) toast.error("الرقم غير صحيح، تم إلغاء المسح");
      return;
    }

    try {
      const toastId = toast.loading("جاري مسح جميع البيانات...");
      const res = await fetch(`/api/products/delete-all`, { method: "DELETE" });
      if (res.ok) {
        toast.success("تم تصفير المخزن ومسح جميع المنتجات بنجاح", { id: toastId });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "فشل المسح", { id: toastId });
      }
    } catch { toast.error("فشل الاتصال بالسيرفر"); }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("لا توجد بيانات لتصديرها!");
      return;
    }
    const exportData = products.map(p => ({
      "الاسم": p.name,
      "الباركود": p.barcode || "",
      "سعر البيع": p.price,
      "سعر الشراء": p.costPrice,
      "الرصيد": p.stock,
      "القسم": p.category?.name || "",
      "طريقة البيع": p.priceType === "weight" ? "وزن" : "قطعة",
      "الوحدة": p.unit
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "منتجات المتجر");
    XLSX.writeFile(wb, `Products_Export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    toast.success("تم التصدير لملف إكسيل بنجاح");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mappedData = data.map((row: any) => ({
          name: row["الاسم"] || row["name"],
          barcode: row["الباركود"] || row["barcode"],
          price: row["سعر البيع"] || row["price"],
          costPrice: row["سعر الشراء"] || row["costPrice"],
          stock: row["الرصيد"] || row["stock"],
          category: row["القسم"] || row["category"],
          priceType: (row["طريقة البيع"] === "وزن" || row["priceType"] === "weight") ? "weight" : "unit",
          unit: row["الوحدة"] || row["unit"] || "piece",
        }));

        const toastId = toast.loading("جاري قراءة واستيراد البيانات...");
        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedData)
        });

        if (res.ok) {
          const result = await res.json();
          toast.success(result.message || "تم الاستيراد بنجاح!", { id: toastId });
          fetchData();
        } else {
          const err = await res.json();
          toast.error(err.error || "فشل الاستيراد", { id: toastId });
        }
      } catch (error) {
        toast.error("ملف الإكسيل غير صالح للعمل");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStockSubmit = async () => {
    if (!stockForm.productId || !stockForm.quantity) { toast.error("أكمل الحقول الناقصة أولاً"); return; }
    try {
      const res = await fetch("/api/stock-logs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(stockForm.productId), type: stockForm.type,
          quantity: parseFloat(stockForm.quantity), reason: stockForm.reason, notes: stockForm.notes,
        }),
      });
      if (res.ok) {
        toast.success("تم تسجيل العملية بنجاح");
        setShowStockForm(false);
        setStockForm({ productId: "", type: "in", quantity: "", reason: "purchase", notes: "" });
        fetchData();
      } else { const err = await res.json(); toast.error(err.error || "فشل التسجيل"); }
    } catch { toast.error("خطأ في الاتصال"); }
  };

  const resetProductForm = () => {
    setProductForm({ name: "", barcode: "", categoryId: "", priceType: "unit", price: "", costPrice: "", stock: "", minStock: "5", unit: "piece" });
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, barcode: product.barcode || "", categoryId: product.categoryId.toString(),
      priceType: product.priceType as "unit" | "weight", price: product.price.toString(),
      costPrice: product.costPrice.toString(), stock: product.stock.toString(),
      minStock: product.minStock.toString(), unit: product.unit,
    });
    setShowProductForm(true);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)
  );

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const lowStockCount = lowStockProducts.length;

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-blue-500/30">
      {/* Dynamic Animated Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-white/50 px-6 py-5 flex items-center justify-between sticky top-0 z-10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-5">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-md transition-all hover:scale-105 active:scale-95">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse" style={{animationDuration: '3s'}}>
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700 tracking-tight">إدارة المخزون الذكية</h1>
              <p className="text-sm font-bold text-slate-500 tracking-wide mt-1">منتجات، استيراد/تصدير، تقارير الجرد</p>
            </div>
          </div>
        </div>
        
        {/* Quick Excel Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-2xl transition-all shadow-sm font-bold hover:-translate-y-1">
            <Upload className="w-5 h-5" />
            استيراد
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />

          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-2xl transition-all shadow-sm font-bold hover:-translate-y-1">
            <Download className="w-5 h-5" />
            تصدير
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-1"></div>

          <div className="flex flex-col items-end px-2">
            <span className="text-sm font-black text-slate-900">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المشرف</span>
          </div>
          
          <button onClick={handleDeleteAll} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 border-2 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm font-bold hover:-translate-y-1 group">
            <Trash className="w-5 h-5 group-hover:animate-bounce" />
            تصفير المخزن
          </button>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in relative z-0">
        
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المنتجات المسجلة" value={products.length.toString()} icon={Boxes} gradient="from-blue-500 to-indigo-600" shadow="shadow-blue-500/20" />
          <StatCard title="إجمالي قيمة المخزون" value={formatPrice(totalStockValue)} icon={Package} gradient="from-emerald-400 to-teal-500" shadow="shadow-emerald-500/20" />
          <StatCard title="نواقص تحتاج شراء" value={lowStockCount.toString()} icon={AlertTriangle} gradient="from-rose-400 to-red-500" shadow="shadow-rose-500/20" isAlert={lowStockCount > 0} />
          <StatCard title="أقسام المتجر" value={categories.length.toString()} icon={Layers} gradient="from-purple-500 to-fuchsia-600" shadow="shadow-purple-500/20" />
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex items-center bg-white/70 backdrop-blur-xl p-2 rounded-3xl border border-white shadow-lg w-fit overflow-x-auto mx-auto lg:mx-0">
          {[
            { key: "products", label: "المنتجات والأصناف", icon: Package },
            { key: "stock", label: "حركات التوريد والصرف", icon: TrendingUp },
            { key: "categories", label: "أقسام المتجر", icon: Layers },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[16px] font-black transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.key 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 scale-100 translate-y-0" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 scale-95"
              }`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? "animate-spin" : ""}`} style={{ animationIterationCount: 1, animationDuration: '0.5s' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="transition-all duration-500 ease-in-out">
          
          {/* TAB 1: PRODUCTS */}
          {activeTab === "products" && (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] space-y-8 animate-fade-in">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 w-full bg-slate-50/80 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all shadow-inner">
                  <Search className="w-6 h-6 text-blue-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو الباركود لفلترة الأصناف..." className="bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none w-full font-bold text-lg" />
                </div>
                <button onClick={() => { setEditingProduct(null); resetProductForm(); setShowProductForm(true); }}
                  className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-[1.5rem] transition-all shadow-[0_8px_25px_rgba(79,70,229,0.4)] text-[18px] font-black hover:-translate-y-1 hover:shadow-2xl w-full lg:w-auto">
                  <Plus className="w-6 h-6" />
                  إضافة صنف جديد
                </button>
              </div>

              {lowStockProducts.length > 0 && (
                <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-5 blur-3xl rounded-full mix-blend-multiply animate-pulse"></div>
                  <h3 className="font-black text-rose-600 flex items-center gap-3 mb-5 text-xl relative z-10">
                    <AlertTriangle className="w-7 h-7 animate-pulse" />
                    تحذير: منتجات وصلت لحد النواقص ويرجى طلبها ({lowStockProducts.length})
                  </h3>
                  <div className="flex flex-wrap gap-3 relative z-10">
                    {lowStockProducts.map((p) => (
                      <span key={p.id} className="bg-white border-2 border-rose-100 px-5 py-2.5 rounded-xl text-[15px] font-black text-rose-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default flex items-center gap-2">
                        {p.name}
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg text-xs">{p.stock} {p.unit}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-slate-500 font-black text-[14px]">
                        <th className="py-5 px-6 rounded-tr-[2rem]">الصنف</th>
                        <th className="py-5 px-6">الباركود</th>
                        <th className="py-5 px-6">سعر البيع</th>
                        <th className="py-5 px-6">التكلفة</th>
                        <th className="py-5 px-6">المخزون الفعلي</th>
                        <th className="py-5 px-6">القسم</th>
                        <th className="py-5 px-6 rounded-tl-[2rem]">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors group ${product.stock <= product.minStock ? "bg-rose-50/30" : ""}`}>
                          <td className="py-5 px-6 font-black text-slate-800 text-[16px]">{product.name}</td>
                          <td className="py-5 px-6 text-slate-400 font-mono text-[14px] font-bold">
                            {product.barcode ? <span className="bg-slate-100 px-3 py-1 rounded-lg">{product.barcode}</span> : "-"}
                          </td>
                          <td className="py-5 px-6 font-black text-emerald-600 text-[18px]">{formatPrice(product.price)}</td>
                          <td className="py-5 px-6 text-slate-500 font-bold">{formatPrice(product.costPrice)}</td>
                          <td className="py-5 px-6">
                            <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[16px] shadow-sm border ${product.stock <= product.minStock ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                              {product.stock} <span className="text-xs font-bold opacity-70">{product.unit}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl font-bold text-[13px] shadow-sm">{product.category.name}</span>
                          </td>
                          <td className="py-5 px-6 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                              <button onClick={() => startEdit(product)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-500 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 hover:text-white text-slate-500 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK LOGS */}
          {activeTab === "stock" && (
            <div className="space-y-8 animate-fade-in">
              <button onClick={() => setShowStockForm(true)}
                className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-[1.5rem] transition-all shadow-[0_8px_30px_rgba(124,58,237,0.4)] text-[18px] font-black hover:-translate-y-1 hover:shadow-2xl">
                <Plus className="w-7 h-7" />
                تسجيل إذن إضافة أو صرف للمخزن
              </button>
              <StockLogsTable />
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === "categories" && <CategoriesManager />}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
              <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                {editingProduct ? "تعديل بطاقة الصنف" : "تسجيل صنف جديد"}
              </h3>
              <button onClick={() => setShowProductForm(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 hover:bg-slate-100 hover:rotate-90 transition-all">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2">اسم الصنف <span className="text-rose-500">*</span></label>
                  <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="اكتب اسم المنتج بدقة..." />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2">الباركود</label>
                  <input type="text" value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black font-mono text-xl text-blue-600 tracking-widest focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" placeholder="000000000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">القسم التابع له <span className="text-rose-500">*</span></label>
                <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700">
                  <option value="" disabled>-- اختر القسم الذي ينتمي إليه المنتج --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">طريقة البيع والتسعير</label>
                  <select value={productForm.priceType} onChange={(e) => setProductForm({ ...productForm, priceType: e.target.value as "unit" | "weight" })} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm">
                    <option value="unit">يباع بالقطعة / العبوة</option>
                    <option value="weight">يباع بالوزن (ميزان)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">وحدة القياس بالمخزن</label>
                  <select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm">
                    <option value="piece">قطعة / حبة</option>
                    <option value="kg">كيلو جرام</option>
                    <option value="gram">جرام</option>
                    <option value="pack">باكيت / كيس</option>
                    <option value="box">علبة / كرتونة</option>
                    <option value="bottle">زجاجة / عبوة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-5 rounded-3xl border-2 border-emerald-100">
                  <label className="block text-sm font-black text-emerald-800 mb-3">سعر بيع الجمهور <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-6 py-5 pl-14 bg-white border-none rounded-2xl font-black text-3xl text-emerald-600 focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all shadow-lg" placeholder="0.00" />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600/40 font-black text-xl">ج.م</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100">
                  <label className="block text-sm font-black text-slate-700 mb-3">سعر الشراء / التكلفة</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} className="w-full px-6 py-5 pl-14 bg-white border-none rounded-2xl font-black text-2xl text-slate-800 focus:ring-4 focus:ring-slate-500/20 outline-none transition-all shadow-md" placeholder="0.00" />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">ج.م</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">رصيد المخزن الحالي</label>
                  <input type="number" step="0.001" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-blue-600 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-center" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-black text-rose-600 mb-2">حد التنبيه بالنواقص</label>
                  <input type="number" step="0.001" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} className="w-full px-6 py-4 bg-rose-50 border-2 border-rose-100 rounded-2xl font-black text-xl text-rose-600 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all text-center" placeholder="5" />
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleSaveProduct} className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 text-2xl hover:-translate-y-1">
                  <Save className="w-7 h-7" />
                  {editingProduct ? "اعتماد التعديلات وحفظها" : "إضافة المنتج وتفعيله بالنظام"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Form Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <h3 className="font-black text-3xl text-slate-800 mb-8 pb-6 border-b border-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 text-center">إذن حركة مخزنية</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">حدد المنتج المعني</label>
                <select value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
                  <option value="" disabled>ابحث في القائمة لإنزال المنتج...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — المتوفر: {p.stock} {p.unit}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">تحديد نوع الإذن</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setStockForm({ ...stockForm, type: "in" })}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
                      stockForm.type === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg transform -translate-y-1" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-300"
                    }`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stockForm.type === "in" ? "bg-emerald-200/50 text-emerald-600" : "bg-white shadow-sm text-slate-400"}`}>
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <span className="font-black text-xl">إذن إضافة (توريد)</span>
                  </button>
                  <button onClick={() => setStockForm({ ...stockForm, type: "out" })}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
                      stockForm.type === "out" ? "border-rose-500 bg-rose-50 text-rose-700 shadow-lg transform -translate-y-1" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-300"
                    }`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stockForm.type === "out" ? "bg-rose-200/50 text-rose-600" : "bg-white shadow-sm text-slate-400"}`}>
                      <TrendingDown className="w-7 h-7" />
                    </div>
                    <span className="font-black text-xl">إذن صرف (سحب)</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">الكمية المدرجة</label>
                  <input type="number" step="0.001" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} className="w-full px-6 py-4 bg-white border-none rounded-2xl font-black text-3xl text-center focus:ring-4 focus:ring-purple-500/20 outline-none transition-all shadow-sm text-purple-700" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">سبب الإذن</label>
                  <select value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} className="w-full px-6 py-4 bg-white border-none rounded-2xl font-bold text-lg focus:ring-4 focus:ring-purple-500/20 outline-none transition-all shadow-sm text-slate-700">
                    <option value="purchase">شراء وتوريد</option>
                    <option value="return">مرتجع بضاعة</option>
                    <option value="damage">هالك / تالف</option>
                    <option value="adjustment">تسوية جردية</option>
                    <option value="other">استخدام آخر</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">بيان تفصيلي للملاحظات (اختياري)</label>
                <input type="text" value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-purple-500/20 outline-none transition-all" placeholder="اكتب رقم فاتورة الشراء أو اسم المورد أو السبب..." />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button onClick={handleStockSubmit} className="flex-[2] py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black transition-all shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-lg text-xl hover:-translate-y-1">
                  تأكيد وترحيل الإذن
                </button>
                <button onClick={() => setShowStockForm(false)} className="flex-1 py-5 px-6 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-black transition-colors text-xl">
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient, shadow, isAlert }: { title: string; value: string; icon: any; gradient: string; shadow: string; isAlert?: boolean }) {
  return (
    <div className={`bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${isAlert ? "animate-pulse" : ""}`}>
      <div className={`absolute -inset-10 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 blur-2xl`}></div>
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-xl ${shadow} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="text-[15px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
      </div>
      <div className="text-4xl font-black text-slate-800 pr-2 relative z-10">{value}</div>
    </div>
  );
}

function StockLogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { fetchLogs(); }, []);
  const fetchLogs = async () => { 
    try {
      const res = await fetch("/api/stock-logs"); 
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []); 
    } catch { 
      setLogs([]); 
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 font-black uppercase text-[14px]">
              <th className="py-6 px-8 rounded-tr-[2rem]">التاريخ والوقت</th>
              <th className="py-6 px-8">الصنف المعني</th>
              <th className="py-6 px-8">تفصيل الحركة</th>
              <th className="py-6 px-8">الكمية والمقدار</th>
              <th className="py-6 px-8 rounded-tl-[2rem]">البيان / السبب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="py-5 px-8 text-slate-500 font-mono font-bold text-[14px] bg-slate-50/50">{new Date(log.createdAt).toLocaleString("ar-EG")}</td>
                <td className="py-5 px-8 font-black text-slate-800 text-[16px]">{log.product.name}</td>
                <td className="py-5 px-8">
                  <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[14px] shadow-sm border ${log.type === "in" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    {log.type === "in" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {log.type === "in" ? "إضافة للمخزن" : "صرف وسحب"}
                  </div>
                </td>
                <td className="py-5 px-8 font-black text-slate-900 text-[20px]">{log.quantity} <span className="text-sm font-bold text-slate-400">{log.product.unit}</span></td>
                <td className="py-5 px-8 font-bold text-slate-600">{
                  log.reason === "purchase" ? "شراء بضاعة" : 
                  log.reason === "return" ? "مرتجع عملاء" : 
                  log.reason === "damage" ? "بضاعة تالفة" : 
                  log.reason === "adjustment" ? "تسوية نظام" : "غير ذلك"
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => { 
    try {
      const res = await fetch("/api/categories"); 
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []); 
    } catch { 
      setCategories([]); 
    }
  };
  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const toastId = toast.loading("جاري الإضافة...");
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategory }) });
    if (res.ok) { toast.success("تم إنشاء القسم بنجاح", { id: toastId }); setNewCategory(""); fetchCategories(); }
    else { toast.error("حدث خطأ", { id: toastId }); }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 mb-10 bg-slate-50 p-4 rounded-[2rem] border border-slate-200 shadow-inner">
        <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="قم بكتابة مسمى القسم الجديد للبدء بإضافته..."
          className="flex-1 px-8 py-5 bg-white border-none rounded-2xl font-black text-xl text-slate-800 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all shadow-sm" />
        <button onClick={handleAdd} className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-black transition-all shadow-[0_8px_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 text-xl hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)]">
          <Plus className="w-7 h-7" />
          تسجيل قسم جديد
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border-2 border-slate-100 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-purple-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg transform group-hover:scale-110 duration-300 relative z-10">
              <Layers className="w-10 h-10" />
            </div>
            <div className="relative z-10">
              <span className="block font-black text-2xl text-slate-800 mb-2">{cat.name}</span>
              <span className="inline-block text-[14px] font-black text-slate-600 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">مقيد به {cat._count.products} صنف</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}