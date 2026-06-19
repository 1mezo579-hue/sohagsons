"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatPrice } from "@/lib/utils";
import { printReceipt, toReceiptInvoice } from "@/lib/receiptPrint";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";
import toast from "react-hot-toast";
import {
  Search, Trash2, Minus, Plus, Printer, RotateCcw,
  CreditCard, Banknote, ScanLine,
  X, Package, Weight, Clock, Phone, CheckCircle2, ChevronDown, ChevronUp
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
  category: { name: string };
}

interface ReturnCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  priceType: string;
  total: number;
}

export default function ReturnsPage() {
  const { user, isChecked } = useRequireAuth(["admin", "manager", "cashier"]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cartItems, setCartItems] = useState<ReturnCartItem[]>([]);
  const [paymentType, setPaymentType] = useState<"cash" | "card">("cash");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [weightInput, setWeightInput] = useState<{ productId: number; weight: string; moneyAmount: string } | null>(null);
  const [displayLimit, setDisplayLimit] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReturn, setLastReturn] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    barcodeRef.current?.focus();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchProducts = async (quiet = false) => {
    try {
      const res = await fetch(`/api/products?limit=2000`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllProducts(data);
        setProducts(data);
      }
    } catch {
      toast.error("فشل تحديث الأصناف من السيرفر");
    }
  };

  // Local Instant Search
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.includes(q)
      );
      setProducts(filtered);
    } else {
      setProducts(allProducts);
    }
    setDisplayLimit(80);
  }, [searchQuery, allProducts]);

  const addToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQty, total: newQty * item.price }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            unit: product.unit,
            priceType: product.priceType,
            total: product.price * quantity,
          }
        ];
      }
    });
    toast.success(`تمت إضافة المرتجع: ${product.name}`);
  };

  const handleBarcode = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = barcodeInput.trim();
      if (!code) return;

      // ─── Scale Barcode Support ───
      if (code.length === 13 && (code.startsWith("20") || code.startsWith("99"))) {
        const pluCode = code.substring(2, 7);
        const weightValue = parseInt(code.substring(7, 12));
        const weight = weightValue / 1000;

        let product = allProducts.find((p) => p.barcode === pluCode);
        if (product) {
          addToCart(product, weight);
          setBarcodeInput("");
          return;
        }
      }

      let product = allProducts.find((p) => p.barcode === code);
      if (product) {
        if (product.priceType === "weight") {
          setWeightInput({ productId: product.id, weight: "", moneyAmount: "" });
          setBarcodeInput("");
          return;
        }
        addToCart(product, 1);
        setBarcodeInput("");
      } else {
        toast.error("هذا الباركود غير مسجل في النظام!");
        setBarcodeInput("");
      }
    }
  }, [barcodeInput, allProducts]);

  const handleWeightSubmit = () => {
    if (!weightInput) return;
    const weight = parseFloat(weightInput.weight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("وزن غير صحيح");
      return;
    }

    const product = allProducts.find((p) => p.id === weightInput.productId);
    if (product) {
      addToCart(product, weight);
    }
    setWeightInput(null);
    barcodeRef.current?.focus();
  };

  const handleWeightChange = (value: string, pricePerKg: number) => {
    if (!weightInput) return;
    const weight = parseFloat(value);
    if (isNaN(weight) || weight <= 0) {
      setWeightInput({ ...weightInput, weight: value, moneyAmount: "" });
      return;
    }
    const calculatedMoney = (weight * pricePerKg).toFixed(2);
    setWeightInput({ ...weightInput, weight: value, moneyAmount: calculatedMoney });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const updatePrice = (productId: number, price: number) => {
    if (isNaN(price) || price < 0) return;
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, price, total: item.quantity * price }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
    toast.success("تم الحذف من المرتجعات");
  };

  const getTotalRefund = () => {
    return cartItems.reduce((acc, curr) => acc + curr.total, 0);
  };

  const handleConfirmReturn = async () => {
    if (cartItems.length === 0) return toast.error("سلة المرتجعات فارغة!");

    setIsLoading(true);

    const returnData = {
      userId: user?.id || 1,
      customerId: selectedCustomer?.id || null,
      total: getTotalRefund(),
      paymentType,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    };

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnData),
      });

      if (res.ok) {
        const result = await res.json();
        setLastReturn(result);
        setShowReceipt(true);
        setCartItems([]);
        setSelectedCustomer(null);
        toast.success("تم تأكيد المرتجع وإضافته للمخزون!");

        // Print Returns Receipt
        directPrint(result);
        fetchProducts(); // Refresh stocks
      } else {
        const err = await res.json();
        toast.error(err.error || "فشل تسجيل المرتجع");
      }
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const directPrint = (invoice: any) => {
    if (!invoice) return;
    printReceipt(toReceiptInvoice({ ...invoice, orderType: "return" }));
  };

  // Hotkeys Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); barcodeRef.current?.focus(); }
      if (e.key === "F3") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F4" && cartItems.length > 0) { e.preventDefault(); handleConfirmReturn(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems, paymentType, selectedCustomer, user]);

  if (!isChecked) return <LoadingScreen accent="rose" />;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col animate-fade-in text-slate-800">
      <PageHeader
        title="مرتجع المبيعات"
        subtitle="إرجاع بضائع للمخزن وخصم الإيراد"
        icon={RotateCcw}
        accent="rose"
        actions={
          <>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user?.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {user?.role === "admin" ? "مدير" : "كاشير"}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5">
              {["F2 باركود", "F3 بحث", "F4 تأكيد"].map((k) => (
                <span key={k} className="hotkey-badge">{k}</span>
              ))}
            </div>
          </>
        }
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 lg:overflow-hidden">
        {/* Left: Products list */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 no-print overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barcode Input */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-rose-500" />
                مسح باركود المنتج المرتجع
              </label>
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcode}
                placeholder="امسح الباركود هنا للإضافة السريعة..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Search Input */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-500" />
                البحث عن منتج بالاسم
              </label>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اسم المنتج المرتجع..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Directory list of products to click */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 overflow-auto p-5">
            <div className="flex items-center gap-2 mb-4 text-slate-500">
              <Package className="w-5 h-5 text-rose-500" />
              <span className="font-bold">انقر على الصنف لإضافته لسلة المرتجعات ({products.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {products.slice(0, displayLimit).map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.priceType === "weight") {
                      setWeightInput({ productId: product.id, weight: "", moneyAmount: "" });
                    } else {
                      addToCart(product, 1);
                    }
                  }}
                  className="p-4 rounded-2xl border-2 border-slate-100 bg-white text-right hover:border-rose-400 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all"
                >
                  <div className="font-bold text-[15px] text-slate-900 truncate mb-1">{product.name}</div>
                  <div className="text-rose-600 font-black text-lg">
                    {formatPrice(product.price)}
                    <span className="text-xs text-slate-400 font-medium mr-1">/{product.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    المخزون الحالي: <span className="text-emerald-600 font-bold">{product.stock} {product.unit}</span>
                  </div>
                  {product.priceType === "weight" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg mt-2">
                      <Weight className="w-3.5 h-3.5" />
                      يوزن
                    </span>
                  )}
                </button>
              ))}
            </div>

            {displayLimit < products.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 80)}
                  className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all border border-slate-200 shadow-sm"
                >
                  تحميل المزيد ({products.length - displayLimit})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Return Cart */}
        <div className="w-full lg:w-[450px] flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                </div>
                <span className="font-bold text-xl text-slate-900">سلة المرتجعات</span>
              </div>
              <span className="text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                {cartItems.length} أصناف
              </span>
            </div>

            {/* Return cart items */}
            <div className="flex-1 overflow-auto space-y-3 mb-4 pr-2">
              {cartItems.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <RotateCcw className="w-20 h-20 mx-auto mb-4 opacity-10 text-rose-900 animate-spin" style={{ animationDuration: '10s' }} />
                  <p className="font-bold text-lg text-slate-500">لا توجد مرتجعات</p>
                  <p className="text-sm mt-1 text-slate-400">امسح الباركود أو انقر على صنف للإرجاع</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 group hover:border-rose-300 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 pl-3">
                        <div className="font-bold text-[15px] text-slate-900 truncate">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.quantity} {item.unit}</div>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 0.25)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent border-none outline-none font-bold text-sm"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 0.25)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Refund Unit Price */}
                      <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                        <span className="text-xs text-slate-400 font-bold">سعر الارتجاع:</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center font-black text-rose-600 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-dashed border-slate-200 pt-2 mt-1">
                      <span>إجمالي المسترد للصنف:</span>
                      <span className="text-rose-600 font-black text-sm">{formatPrice(item.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Refund Options & Totals */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              {/* Payment selection */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-500">طريقة رد المبلغ:</span>
                <div className="flex gap-1.5 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                  {[
                    { key: "cash", label: "كاش 💵" },
                    { key: "card", label: "فيزا 💳" }
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPaymentType(p.key as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                        paymentType === p.key
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Selector */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Phone className="w-4 h-4 text-slate-400 mr-1" />
                <select
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const cust = customers.find(c => c.id === id);
                    setSelectedCustomer(cust || null);
                  }}
                  className="bg-transparent border-none outline-none font-bold text-slate-600 text-xs flex-1"
                >
                  <option value="">-- اختياري: خصم نقاط لعميل محدد --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Refund display */}
              <div className="flex justify-between text-2xl font-black bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-700">
                <span>إجمالي المسترد:</span>
                <span>{formatPrice(getTotalRefund())}</span>
              </div>

              <button
                onClick={handleConfirmReturn}
                disabled={cartItems.length === 0 || isLoading}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <span className="animate-spin text-2xl">⟳</span>
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
                {isLoading ? "جاري الحفظ..." : "تأكيد واسترجاع البضاعة (F4)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {weightInput && (() => {
        const product = allProducts.find((p) => p.id === weightInput.productId);
        const kg = parseFloat(weightInput.weight) || 0;
        const total = product ? (kg * product.price).toFixed(2) : "0.00";
        return (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 no-print backdrop-blur-sm">
            <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg mx-auto shadow-2xl animate-slide-up pb-safe">
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="px-6 pt-2 pb-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">الصنف المرتجع المحدد</p>
                <h3 className="font-black text-2xl text-slate-900">{product?.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">سعر الكيلو: <span className="text-rose-600">{product?.price} ج.م</span></p>
              </div>

              {/* Preset weights */}
              <div className="px-6 mb-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">اختر وزناً سريعاً</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((w) => (
                    <button
                      key={w}
                      onClick={() => handleWeightChange(String(w), product?.price || 0)}
                      className={`py-3.5 rounded-2xl font-black text-base transition-all active:scale-95 ${
                        kg === w
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-500/40 scale-105"
                          : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                      }`}
                    >
                      {w} كجم
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight controller input */}
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">أو اكتب الوزن يدوياً (كجم)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="مثال: 0.350..."
                    value={weightInput.weight}
                    onChange={(e) => handleWeightChange(e.target.value, product?.price || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl focus:ring-2 focus:ring-rose-500 outline-none text-left font-mono font-black text-rose-600"
                    dir="ltr"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleWeightSubmit}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-lg transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]"
                  >
                    تأكيد وإضافة
                  </button>
                  <button
                    onClick={() => setWeightInput(null)}
                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RENDER RECEIPTS FOR RETURN */}
      {showReceipt && lastReturn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in no-print">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-lg text-slate-900">إيصال مرتجع مبيعات</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 text-right" id="print-area">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h2 className="text-xl font-black text-slate-900">إيصال إرجاع بضاعة</h2>
                <p className="text-xs text-rose-600 font-bold mt-1">ماركت أبناء سوهاج</p>
                <p className="text-xs text-slate-400 font-mono mt-2">رقم المرتجع: {lastReturn.invoiceNo}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(lastReturn.createdAt).toLocaleString("ar-EG")}</p>
              </div>

              <div className="py-4 border-b border-dashed border-slate-200 space-y-2.5">
                {lastReturn.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm font-bold text-slate-800">
                    <span className="truncate flex-1 pl-2">{item.product.name}</span>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{item.quantity} × {formatPrice(item.price)}</span>
                    <span className="font-mono text-rose-600 pr-4 shrink-0">-{formatPrice(Math.abs(item.total))}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-2 text-right">
                <div className="flex justify-between items-center font-black text-lg text-rose-600">
                  <span>إجمالي المسترد:</span>
                  <span>-{formatPrice(Math.abs(lastReturn.total))}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>طريقة الرد:</span>
                  <span>{lastReturn.paymentType === "cash" ? "نقدي (كاش) 💵" : "فيزا 💳"}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>المشرف المسؤول:</span>
                  <span>{user?.name}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={() => directPrint(lastReturn)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة إيصال
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
