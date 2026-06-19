"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Plus, Package, AlertTriangle, Search,
  TrendingUp, TrendingDown, Edit2, Trash2, X, Save,
  Boxes, Layers, Download, Upload, Trash, Eye, EyeOff
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  categoryId: number | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  priceType: string;
  unit: string;
  expiryDate?: string | null;
  category: { id: number; name: string } | null;
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
  const [visibleCount, setVisibleCount] = useState(20);
  const [showTotalValue, setShowTotalValue] = useState(true);
  
  // Modals state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockForm, setShowStockForm] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  // Forms state
  const [productForm, setProductForm] = useState({
    name: "", barcode: "", categoryId: "", priceType: "unit" as "unit" | "weight",
    price: "", costPrice: "", stock: "", minStock: "5", unit: "piece", expiryDate: "",
  });
  const [lastDefaults, setLastDefaults] = useState({
    unit: "piece", priceType: "unit" as "unit" | "weight", categoryId: ""
  });
  const [stockForm, setStockForm] = useState({
    productId: "", type: "in" as "in" | "out", quantity: "", reason: "purchase", notes: "",
  });
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  // Auto-open Add Product form if navigated from cashier with ?addBarcode=
  useEffect(() => {
    if (!isChecked) return;
    const params = new URLSearchParams(window.location.search);
    const barcode = params.get("addBarcode");
    if (barcode) {
      setEditingProduct(null);
      setProductForm({
        name: "", barcode, categoryId: "", priceType: "unit",
        price: "", costPrice: "", stock: "", minStock: "5", unit: "piece", expiryDate: "",
      });
      setShowProductForm(true);
      // Trigger Open Food Facts lookup
      setTimeout(() => lookupBarcode(barcode), 400);
    }
  }, [isChecked]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/categories"),
      ]);
      
      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error("API failed");
      }

      const pData = await productsRes.json();
      const cData = await categoriesRes.json();
      
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (error) { 
      console.error("Fetch data error:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات، يرجى تحديث الصفحة"); 
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error("يرجى كتابة الاسم والسعر على الأقل"); return;
    }
    const data = {
      name: productForm.name, barcode: productForm.barcode || null,
      categoryId: productForm.categoryId ? parseInt(productForm.categoryId) : null, 
      priceType: productForm.priceType,
      price: parseFloat(productForm.price), costPrice: parseFloat(productForm.costPrice) || 0,
      stock: parseFloat(productForm.stock) || 0, minStock: parseFloat(productForm.minStock) || 5,
      unit: productForm.unit,
      expiryDate: productForm.expiryDate || null,
    };
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) {
        toast.success(editingProduct ? "تم تحديث المنتج" : "تمت إضافة المنتج بنجاح");
        
        // Update defaults for next entry
        setLastDefaults({
          unit: productForm.unit,
          priceType: productForm.priceType,
          categoryId: productForm.categoryId
        });

        if (editingProduct) {
          setShowProductForm(false);
          setEditingProduct(null);
        } else {
          // Stay in "Add Mode" but clear fields for next product
          setProductForm({
            name: "", barcode: "", 
            categoryId: productForm.categoryId, // Keep category
            priceType: productForm.priceType,   // Keep price type
            price: "", costPrice: "", stock: "", 
            minStock: "5", 
            unit: productForm.unit,             // Keep unit
            expiryDate: "",
          });
          barcodeInputRef.current?.focus(); // Instant focus for next barcode
          
          // If we came from Cashier, return there
          const params = new URLSearchParams(window.location.search);
          if (params.has("addBarcode")) {
            toast("تمت الإضافة، جاري العودة للكاشير...", { icon: "↩️" });
            setTimeout(() => router.push("/cashier"), 600);
          }
        }
        fetchData();
      } else { const err = await res.json(); toast.error(err.error || "فشل الحفظ"); }
    } catch { toast.error("خطأ في الاتصال بالسيرفر"); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟\n\nملاحظة: لا يمكن حذف منتج مرتبط بفواتير سابقة.")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم حذف المنتج");
        fetchData();
      } else {
        toast.error(data.error || "فشل الحذف");
      }
    } catch { toast.error("فشل الحذف"); }
  };

  const lookupBarcode = async (barcode: string) => {
    if (!barcode || barcode.length < 8 || editingProduct) return;
    
    setIsLookingUp(true);
    try {
      // 1. Search in local database first
      const localProduct = products.find(p => p.barcode === barcode);
      if (localProduct) {
        toast.error("هذا الباركود مسجل مسبقاً لمنتج آخر!");
        setProductForm(prev => ({ ...prev, name: localProduct.name }));
        setIsLookingUp(false);
        return;
      }

      // 2. Search in Open Food Facts API (Works great for Egypt)
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.product_name_ar || data.product.generic_name;
        if (productName) {
          setProductForm(prev => ({ ...prev, name: productName }));
          toast.success(`تم العثور على: ${productName}`);
          // Auto focus price input after finding name
          setTimeout(() => document.getElementById('product-price-input')?.focus(), 100);
        }
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
    } finally {
      setIsLookingUp(false);
    }
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
      "الوحدة": p.unit,
      "تاريخ الصلاحية": p.expiryDate || ""
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
          expiryDate: row["تاريخ الصلاحية"] || row["expiryDate"] || null,
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

  const openStockModal = (type: "in" | "out", productId: string = "") => {
    setStockForm({
      productId,
      type,
      quantity: "",
      reason: type === "in" ? "purchase" : "damage",
      notes: "",
    });
    setShowStockForm(true);
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
    setProductForm({ 
      name: "", barcode: "", 
      categoryId: lastDefaults.categoryId, 
      priceType: lastDefaults.priceType, 
      price: "", costPrice: "", stock: "", minStock: "5", 
      unit: lastDefaults.unit,
      expiryDate: "",
    });
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, 
      barcode: product.barcode || "", 
      categoryId: product.categoryId?.toString() || "",
      priceType: product.priceType as "unit" | "weight", 
      price: product.price.toString(),
      costPrice: product.costPrice.toString(), 
      stock: product.stock.toString(),
      minStock: product.minStock.toString(), 
      unit: product.unit,
      expiryDate: product.expiryDate || "",
    });
    setShowProductForm(true);
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name || "").toLowerCase();
    const barcode = p.barcode || "";
    const search = searchQuery.toLowerCase();
    return name.includes(search) || barcode.includes(searchQuery);
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const lowStockCount = lowStockProducts.length;

  if (!isChecked) return <LoadingScreen accent="emerald" />;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="إدارة المخزون"
        subtitle="منتجات، استيراد/تصدير، تقارير الجرد"
        icon={Package}
        accent="emerald"
        actions={
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-sm">
              <Upload className="w-4 h-4" />
              استيراد
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-sm">
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        }
      />

      <div className="page-content max-w-[1400px] space-y-8 animate-fade-in">
        
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المنتجات المسجلة" value={products.length.toString()} icon={Boxes} gradient="from-blue-500 to-indigo-600" shadow="shadow-blue-500/20" />
          <StatCard 
            title="إجمالي قيمة المخزون" 
            value={showTotalValue ? formatPrice(totalStockValue) : "••••••"} 
            icon={Package} 
            gradient="from-emerald-400 to-teal-500" 
            shadow="shadow-emerald-500/20" 
            toggleable
            isShowing={showTotalValue}
            onToggle={() => setShowTotalValue(!showTotalValue)}
          />
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
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(20); // Reset count directly here
                    }}
                    placeholder="ابحث بالاسم أو الباركود لفلترة الأصناف..." 
                    className="bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none w-full font-bold text-lg" 
                  />
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
                        <th className="py-5 px-6">تاريخ الصلاحية</th>
                        <th className="py-5 px-6 rounded-tl-[2rem]">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayedProducts.length > 0 ? (
                        displayedProducts.map((product) => (
                          <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors group ${product.stock <= product.minStock ? "bg-rose-50/30" : ""}`}>
                            <td className="py-5 px-6 font-black text-slate-800 text-[16px]">{product.name}</td>
                            <td className="py-5 px-6 text-slate-400 font-mono text-[14px] font-bold">
                              {product.barcode ? <span className="bg-slate-100 px-3 py-1 rounded-lg">{product.barcode}</span> : "-"}
                            </td>
                            <td className="py-5 px-6 font-black text-emerald-600 text-[18px]">{formatPrice(product.price)}</td>
                            <td className="py-5 px-6 text-slate-500 font-bold">{formatPrice(product.costPrice)}</td>
                            <td className="py-5 px-6">
                              <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[16px] shadow-sm border ${product.stock <= product.minStock ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                                {product.priceType === "weight" ? product.stock.toFixed(3) : product.stock}
                                <span className="text-xs font-bold opacity-70">{product.priceType === "weight" ? "كجم" : "قطعة"}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-xl font-bold text-[13px] shadow-sm">{product.category?.name || "عام"}</span>
                            </td>
                            <td className="py-5 px-6">
                              {product.expiryDate ? (
                                <span className={`px-3 py-1.5 rounded-xl font-bold text-[13px] shadow-sm border ${
                                  (() => {
                                    const d = new Date(product.expiryDate);
                                    if (isNaN(d.getTime())) return "bg-blue-50 text-blue-700 border-blue-100";
                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    const nearExpiryLimit = new Date();
                                    nearExpiryLimit.setDate(nearExpiryLimit.getDate() + 30);
                                    if (d < now) return "bg-rose-50 text-rose-700 border-rose-200";
                                    if (d <= nearExpiryLimit) return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
                                    return "bg-emerald-50 text-emerald-700 border-emerald-100";
                                  })()
                                }`}>
                                  {product.expiryDate}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">-</span>
                              )}
                            </td>
                            <td className="py-5 px-6 opacity-50 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openStockModal("in", product.id.toString())} title="إضافة رصيد" className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-emerald-600 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => openStockModal("out", product.id.toString())} title="صرف رصيد" className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 hover:text-white text-rose-600 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                  <TrendingDown className="w-4 h-4" />
                                </button>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <button onClick={() => startEdit(product)} title="تعديل" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-500 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id)} title="حذف" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 hover:text-white text-slate-500 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-20 text-center text-slate-400 font-bold text-lg italic">
                            {products.length === 0 ? "جاري تحميل المنتجات أو لا يوجد بيانات..." : "لا توجد نتائج تطابق بحثك"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 50)}
                    className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-all border-2 border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    تحميل المزيد من المنتجات ({filteredProducts.length - visibleCount} متبقي)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STOCK LOGS */}
          {activeTab === "stock" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-wrap gap-4">
                <button onClick={() => openStockModal("in")}
                  className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-[1.5rem] transition-all shadow-[0_8px_30px_rgba(16,185,129,0.4)] text-[18px] font-black hover:-translate-y-1 hover:shadow-2xl flex-1 justify-center min-w-[280px]">
                  <TrendingUp className="w-7 h-7" />
                  تسجيل إذن إضافة (توريد)
                </button>
                <button onClick={() => openStockModal("out")}
                  className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-[1.5rem] transition-all shadow-[0_8px_30px_rgba(225,29,72,0.4)] text-[18px] font-black hover:-translate-y-1 hover:shadow-2xl flex-1 justify-center min-w-[280px]">
                  <TrendingDown className="w-7 h-7" />
                  تسجيل إذن صرف (سحب مخزني)
                </button>
              </div>
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
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  {editingProduct ? "تعديل بطاقة الصنف" : "تسجيل صنف جديد"}
                </h3>
                {!editingProduct && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black animate-pulse">وضع الإضافة السريع فعال</span>
                )}
              </div>
              <button onClick={() => setShowProductForm(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 hover:bg-slate-100 hover:rotate-90 transition-all">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2">اسم الصنف <span className="text-rose-500">*</span></label>
                  <input ref={productNameRef} type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && barcodeInputRef.current?.focus()} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="اكتب اسم المنتج بدقة..." />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2 flex items-center justify-between">
                    <span>الباركود</span>
                    {isLookingUp && <span className="text-[10px] text-blue-600 animate-pulse">جاري البحث عن الاسم...</span>}
                  </label>
                  <div className="relative">
                    <input 
                      ref={barcodeInputRef} 
                      type="text" 
                      value={productForm.barcode} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductForm({ ...productForm, barcode: val });
                        if (val.length >= 8) lookupBarcode(val);
                      }} 
                      onKeyDown={(e) => e.key === "Enter" && document.getElementById('product-price-input')?.focus()} 
                      className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-black font-mono text-xl tracking-widest focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 ${isLookingUp ? "border-blue-400" : "border-slate-100"}`} 
                      placeholder="000000000" 
                      autoFocus 
                    />
                    {isLookingUp && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">القسم التابع له (اختياري)</label>
                <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700">
                  <option value="">-- بدون قسم (عام) --</option>
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
                    <input id="product-price-input" type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleSaveProduct()} className="w-full px-6 py-5 pl-14 bg-white border-none rounded-2xl font-black text-3xl text-emerald-600 focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all shadow-lg" placeholder="0.00" />
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
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2">تاريخ الصلاحية</label>
                  <input 
                    type="date" 
                    value={productForm.expiryDate} 
                    onChange={(e) => setProductForm({ ...productForm, expiryDate: e.target.value })} 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700" 
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    رصيد المخزن الحالي
                    <span className={`mr-2 text-xs px-2 py-0.5 rounded-full font-black ${
                      productForm.priceType === "weight"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {productForm.priceType === "weight" ? "بالكيلو (كجم)" : "بالقطعة"}
                    </span>
                  </label>
                  <div className="relative">
                    <input type="number" step={productForm.priceType === "weight" ? "0.001" : "1"} value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full px-6 py-4 pl-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-blue-600 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all" placeholder={productForm.priceType === "weight" ? "0.000" : "0"} />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-black text-xs">{productForm.priceType === "weight" ? "كجم" : "قطعة"}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-black text-rose-600 mb-2">
                    حد التنبيه بالنواقص
                    <span className={`mr-2 text-xs px-2 py-0.5 rounded-full font-black ${
                      productForm.priceType === "weight"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-rose-50 text-rose-400"
                    }`}>
                      {productForm.priceType === "weight" ? "كجم" : "قطعة"}
                    </span>
                  </label>
                  <div className="relative">
                    <input type="number" step={productForm.priceType === "weight" ? "0.001" : "1"} value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} className="w-full px-6 py-4 pl-14 bg-rose-50 border-2 border-rose-100 rounded-2xl font-black text-xl text-rose-600 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all" placeholder={productForm.priceType === "weight" ? "5.000" : "5"} />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-black text-xs">{productForm.priceType === "weight" ? "كجم" : "قطعة"}</span>
                  </div>
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

function StatCard({ 
  title, value, icon: Icon, gradient, shadow, isAlert, toggleable, isShowing, onToggle 
}: { 
  title: string; value: string; icon: any; gradient: string; shadow: string; isAlert?: boolean;
  toggleable?: boolean; isShowing?: boolean; onToggle?: () => void;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${isAlert ? "animate-pulse" : ""}`}>
      <div className={`absolute -inset-10 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 blur-2xl`}></div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-xl ${shadow} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="text-[15px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
        </div>
        {toggleable && (
          <button 
            onClick={onToggle}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            {isShowing ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
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