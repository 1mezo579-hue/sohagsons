"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCartStore } from "@/hooks/useCartStore";
import { formatPrice, generateInvoiceNo } from "@/lib/utils";
import { CartItem } from "@/types";
import toast from "react-hot-toast";
import {
  Search, Trash2, Minus, Plus, Printer, ShoppingCart,
  ArrowRight, CreditCard, Banknote, Percent, ScanLine,
  X, Package, Weight, Clock, Phone, Edit2, Truck
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

export default function CashierPage() {
  const { user, isChecked } = useRequireAuth();
  const cart = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [weightInput, setWeightInput] = useState<{ productId: number; weight: string; moneyAmount: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayLimit, setDisplayLimit] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pilotChange, setPilotChange] = useState<number>(0);
  const selectedCustomer = cart.selectedCustomer;
  const setSelectedCustomer = cart.setSelectedCustomer;
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", barcode: "", price: "" });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const quickAddNameRef = useRef<HTMLInputElement>(null);
  const quickAddPriceRef = useRef<HTMLInputElement>(null);
  const editPriceRef = useRef<HTMLInputElement>(null);

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
    if (!quiet) setIsLoading(true);
    try {
      // Try to load from cache first for instant speed
      const cached = localStorage.getItem("sohag_products_cache");
      if (cached && !quiet) {
        const parsed = JSON.parse(cached);
        setAllProducts(parsed);
        setProducts(parsed);
      }

      const res = await fetch(`/api/products?limit=2000`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllProducts(data);
        localStorage.setItem("sohag_products_cache", JSON.stringify(data));
        // Only update visible products if not currently searching
        if (!searchQuery.trim() && selectedCategory === "all") {
          setProducts(data);
        }
      }
    } catch {
      toast.error("فشل تحديث البيانات من السيرفر");
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  // Instant Local Search & Filter
  useEffect(() => {
    let filtered = allProducts;
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => (p.category?.name || "غير مصنف") === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.barcode?.includes(q)
      );
    }
    
    setProducts(filtered);
    setDisplayLimit(80); // Reset limit on search
  }, [searchQuery, selectedCategory, allProducts]);

  const handleBarcode = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = barcodeInput.trim();
      if (!code) return;

      // ─── Electronic Scale Barcode Support ───
      if (code.length === 13 && (code.startsWith("20") || code.startsWith("99"))) {
        const pluCode = code.substring(2, 7);
        const weightValue = parseInt(code.substring(7, 12));
        const weight = weightValue / 1000;

        let product = allProducts.find((p) => p.barcode === pluCode);

        if (product) {
          addToCart(product, weight);
          setBarcodeInput("");
          toast.success(`تم إضافة ${weight} كجم من ${product.name}`);
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
        toast.success(`تم إضافة: ${product.name}`);
      } else {
        // Open quick-add modal
        setBarcodeInput("");
        setQuickAddForm({ name: "", barcode: code, price: "" });
        setShowQuickAdd(true);
        setTimeout(() => quickAddNameRef.current?.focus(), 80);
      }
    }
  }, [barcodeInput, allProducts]);

  const handleQuickSave = async () => {
    if (!quickAddForm.name.trim() || !quickAddForm.price) {
      toast.error("اكتب الاسم والسعر");
      return;
    }
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickAddForm.name.trim(),
          barcode: quickAddForm.barcode || null,
          price: parseFloat(quickAddForm.price),
          costPrice: 0, stock: 20, minStock: 5,
          priceType: "unit", unit: "piece",
        }),
      });
      if (res.ok) {
        const newProduct = await res.json();
        setAllProducts(prev => [newProduct, ...prev]);
        const item: CartItem = {
          productId: newProduct.id, name: newProduct.name,
          price: newProduct.price, quantity: 1,
          unit: newProduct.unit, priceType: newProduct.priceType,
          total: newProduct.price,
        };
        cart.addItem(item);
        toast.success(`➕ تمت إضافة: ${newProduct.name}`);
        setShowQuickAdd(false);
        barcodeRef.current?.focus();
      } else {
        const err = await res.json();
        toast.error(err.error || "فشل الحفظ");
      }
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    if (product.stock < quantity) {
      toast.error("الكمية غير متوفرة في المخزن!");
      return;
    }

    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      unit: product.unit,
      priceType: product.priceType,
      total: product.price * quantity,
    };
    cart.addItem(item);
  };
  
  const handleQuickProductUpdate = async () => {
    if (!editingProduct || !newPrice || !newName.trim()) return;
    setIsUpdatingPrice(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          name: newName.trim(),
          price: parseFloat(newPrice),
          categoryId: (editingProduct.category as any)?.id || null, // Ensure ID is passed not object
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAllProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        cart.updateProductDetails(updated.id, updated.name, updated.price); // Update cart details too
        toast.success(`تم تحديث الصنف ${updated.name} بنجاح`);
        setEditingProduct(null);
      } else {
        toast.error("فشل تحديث الصنف");
      }
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleWeightSubmit = () => {
    if (!weightInput) return;
    const weight = parseFloat(weightInput.weight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("وزن غير صحيح");
      return;
    }

    const product = products.find((p) => p.id === weightInput.productId);
    if (product) {
      addToCart(product, weight);
      toast.success(`تم إضافة ${weight} كجم من ${product.name}`);
    }
    setWeightInput(null);
    barcodeRef.current?.focus();
  };

  const handleMoneyChange = (value: string, pricePerKg: number) => {
    if (!weightInput) return;
    const money = parseFloat(value);
    if (isNaN(money) || money <= 0) {
      setWeightInput({ ...weightInput, moneyAmount: value, weight: "" });
      return;
    }
    const calculatedWeight = (money / pricePerKg).toFixed(3);
    setWeightInput({ ...weightInput, moneyAmount: value, weight: calculatedWeight });
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

  const categories = ["all", ...Array.from(new Set(allProducts.map((p) => p.category?.name || "غير مصنف")))];

  const filteredProducts = products;
  const displayedProducts = products.slice(0, displayLimit);
  const hasMore = displayLimit < products.length;

  const handleCheckout = async (shouldPrint: boolean = true) => {
    if (cart.items.length === 0) return toast.error("السلة فارغة!");
    if (cart.paymentType === "credit" && !selectedCustomer) {
      return toast.error("يجب اختيار اسم العميل لتسجيل الفاتورة كـ آجل");
    }

    setIsLoading(true);

    const invoiceData = {
      invoiceNo: generateInvoiceNo(),
      userId: user?.id || 1,
      customerId: selectedCustomer?.id || null,
      total: cart.getTotal(),
      discount: cart.discount,
      finalTotal: cart.getFinalTotal(),
      paymentType: cart.paymentType,
      orderType: cart.orderType,
      deliveryFee: cart.getDeliveryFee(),
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (res.ok) {
        const invoice = await res.json();
        
        setLastInvoice(invoice);
        setShowCheckout(false);
        if (shouldPrint) {
          setShowReceipt(true);
          // Direct Print
          directPrint(invoice);
        } else {
          setShowReceipt(false);
        }
        setSelectedCustomer(null);
        setPilotChange(0);
        
        const soldItems = cart.items;
        setAllProducts(prev =>
          prev.map(p => {
            const sold = soldItems.find(i => i.productId === p.id);
            return sold ? { ...p, stock: Math.max(0, p.stock - sold.quantity) } : p;
          })
        );

        cart.clearCart();
        toast.success("تم إتمام البيع بنجاح!");

        setTimeout(() => fetchProducts(true), 5000);
      } else {
        const err = await res.json();
        toast.error(err.error || "فشل في حفظ الفاتورة");
      }
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsLoading(false);
    }
  };

  const directPrint = async (invoice: any) => {
    if (!invoice) return;
    const loadingToast = toast.loading("جاري الطباعة...");
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (res.ok) {
        toast.success("تمت الطباعة بنجاح", { id: loadingToast });
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل في الطباعة المباشرة", { id: loadingToast });
        // Fallback to browser print if direct print fails
        window.print();
      }
    } catch (err) {
      toast.error("خطأ في الاتصال بخدمة الطباعة", { id: loadingToast });
      window.print();
    }
  };

  const printReceipt = () => {
    if (lastInvoice) {
      directPrint(lastInvoice);
    } else {
      window.print();
    }
  };


  useEffect(() => {
    let barcodeString = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkeys
      if (e.key === "F2") { e.preventDefault(); barcodeRef.current?.focus(); return; }
      if (e.key === "F3") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "F4" && cart.items.length > 0) { e.preventDefault(); setShowCheckout(true); return; }

      // Global Barcode Scanner Logic
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // If they type manually in the barcode input, let the input's own handleBarcode take care of it
      if (isInput && target === barcodeRef.current) return;

      if (e.key === 'Enter') {
        if (barcodeString.length >= 3) {
          e.preventDefault();
          const code = barcodeString;

          // ─── Scale Barcode Check in Global Listener ───
          if (code.length === 13 && (code.startsWith("20") || code.startsWith("99"))) {
            const pluCode = code.substring(2, 7);
            const weight = parseInt(code.substring(7, 12)) / 1000;
            const product = allProducts.find((p) => p.barcode === pluCode);
            if (product) {
              cart.addItem({
                productId: product.id, name: product.name, price: product.price,
                quantity: weight, unit: product.unit, priceType: product.priceType, total: product.price * weight,
              });
              toast.success(`تم إضافة ${weight} كجم من ${product.name}`);
              barcodeString = "";
              return;
            }
          }

          let product = allProducts.find((p) => p.barcode === code);
          if (product) {
            if (product.priceType === "weight") {
              setWeightInput({ productId: product.id, weight: "", moneyAmount: "" });
            } else {
              if (product.stock >= 1) {
                cart.addItem({
                  productId: product.id, name: product.name, price: product.price,
                  quantity: 1, unit: product.unit, priceType: product.priceType, total: product.price,
                });
                toast.success(`تم إضافة: ${product.name}`);
              } else {
                toast.error("الكمية غير متوفرة!");
              }
            }
          } else if (!isInput) {
            // Open quick-add modal
            setQuickAddForm({ name: "", barcode: code, price: "" });
            setShowQuickAdd(true);
            setTimeout(() => quickAddNameRef.current?.focus(), 80);
          }
        }
        barcodeString = "";
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeString += e.key;
        clearTimeout(timeout);
        // Scanners type very fast (usually < 20ms per char). Reset if slow (human typing).
        timeout = setTimeout(() => { barcodeString = ""; }, 60);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [allProducts, cart]);

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen bg-[#f8fafc] flex flex-col animate-fade-in text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">كاشير البيع</h1>
              <p className="text-sm text-slate-500 font-medium">ماركت أبناء سوهاج</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role === "admin" ? "مدير" : "كاشير"}</span>
          </div>
          <div className="flex items-center gap-2">
            {["F2 باركود", "F3 بحث", "F4 دفع"].map((k) => (
              <span key={k} className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                {k}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between no-print shadow-sm overflow-x-auto gap-2 scrollbar-none z-10 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {cart.carts.map((c) => {
            const isActive = cart.activeCartId === c.id;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all cursor-pointer select-none font-bold text-sm shrink-0 ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
                onClick={() => cart.switchCart(c.id)}
              >
                <span>{c.name}</span>
                {cart.carts.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cart.removeCart(c.id);
                    }}
                    className={`p-0.5 rounded-md hover:bg-rose-100 hover:text-rose-600 transition-colors ${
                      isActive ? "text-blue-400" : "text-slate-400"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => {
            cart.addCart();
            toast.success("تم فتح حساب زبون جديد!");
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shrink-0 text-sm hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          زبون جديد
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 lg:overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 no-print overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barcode */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-blue-500" />
                مسح الباركود
              </label>
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcode}
                placeholder="امسح الباركود هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                بحث بالاسم
              </label>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm border ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {cat === "all" ? "الكل" : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 overflow-auto p-5">
            <div className="flex items-center gap-2 mb-4 text-slate-500">
              <Package className="w-5 h-5 text-blue-500" />
              <span className="font-bold">المنتجات المتاحة ({filteredProducts.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {displayedProducts.map((product) => (
                <div key={product.id} className="relative group">
                  <button
                    onClick={() => {
                      if (product.priceType === "weight") {
                        setWeightInput({ productId: product.id, weight: "", moneyAmount: "" });
                      } else {
                        addToCart(product, 1);
                      }
                    }}
                    className={`w-full p-4 rounded-2xl border-2 text-right transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 ${
                      product.stock <= product.minStock
                        ? "border-rose-100 bg-rose-50/30 hover:border-rose-300"
                        : product.name.includes("سايب") || product.name.includes("كيلو") 
                        ? "border-blue-100 bg-blue-50/30 hover:border-blue-500" 
                        : "border-slate-100 bg-white hover:border-blue-500/40"
                    }`}
                  >
                    <div className="font-bold text-[15px] text-slate-900 truncate mb-1.5">{product.name}</div>
                    <div className="text-blue-600 font-black text-lg">
                      {formatPrice(product.price)}
                      <span className="text-xs text-slate-400 font-medium mr-1">/{product.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">
                      مخزون: <span className={product.stock <= product.minStock ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                    {product.priceType === "weight" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg mt-2">
                        <Weight className="w-3.5 h-3.5" />
                        يوزن
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingProduct(product); 
                      setNewName(product.name);
                      setNewPrice(product.price.toString());
                      setTimeout(() => editPriceRef.current?.focus(), 100);
                    }}
                    className="absolute top-3 left-3 p-2 bg-white/90 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white text-slate-400 shadow-sm border border-slate-100 z-10"
                    title="تعديل الاسم والسعر"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setDisplayLimit(prev => prev + 80)}
                  className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all border border-slate-200 shadow-sm"
                >
                  تحميل المزيد من الأصناف ({products.length - displayLimit})
                </button>
              </div>
            )}
            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-lg">لا توجد منتجات</p>
                <p className="text-sm">لم يتم العثور على أي منتج يطابق بحثك</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-full lg:w-[450px] flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-xl text-slate-900">سلة المشتريات</span>
              </div>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                {cart.items.length} صنف
              </span>
            </div>

            <div className="flex-1 overflow-auto space-y-3 mb-4 pr-2">
              {cart.items.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-10 text-blue-900" />
                  <p className="font-bold text-lg text-slate-500">السلة فارغة</p>
                  <p className="text-sm mt-1 text-slate-400">امسح الباركود أو اختر منتج للإضافة</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pl-3">
                      <div className="font-bold text-[15px] text-slate-900 truncate">{item.name}</div>
                      <div className="text-sm font-bold text-blue-600 mt-1">
                        {formatPrice(item.price)} <span className="text-xs text-slate-400 font-medium ml-1">× {item.quantity} {item.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                      <button
                        onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                        className="w-9 h-9 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-black text-[15px] text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                        className="w-9 h-9 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                      <button
                        onClick={() => cart.removeItem(item.productId)}
                        className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex justify-between text-[15px] font-bold">
                <span className="text-slate-500">المجموع:</span>
                <span className="text-slate-900">{formatPrice(cart.getTotal())}</span>
              </div>
              {cart.orderType === "delivery" && (
                <div className="flex justify-between text-[15px] font-bold">
                  <span className="text-slate-500">التوصيل:</span>
                  <span className="text-slate-900">{formatPrice(cart.getDeliveryFee())}</span>
                </div>
              )}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Percent className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  value={cart.discount}
                  onChange={(e) => cart.setDiscount(Number(e.target.value))}
                  placeholder="أضف خصم..."
                  className="bg-transparent border-none outline-none text-slate-900 font-bold flex-1"
                />
                <span className="text-sm font-bold text-slate-500 pl-2">ج.م</span>
              </div>
              <div className="flex justify-between text-2xl font-black bg-blue-50 p-4 rounded-2xl border border-blue-200 text-blue-700">
                <span>الإجمالي:</span>
                <span>{formatPrice(cart.getFinalTotal())}</span>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.items.length === 0 || isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <span className="animate-spin text-2xl">⟳</span>
                ) : (
                  <CreditCard className="w-6 h-6" />
                )}
                {isLoading ? "جاري الحفظ..." : "إتمام البيع (F4)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Swipe Modal */}
      {weightInput && (() => {
        const product = allProducts.find((p) => p.id === weightInput.productId);
        const kg = parseFloat(weightInput.weight) || 0;
        const total = product ? (kg * product.price).toFixed(2) : "0.00";
        return (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 no-print backdrop-blur-sm">
            <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg mx-auto shadow-2xl animate-slide-up pb-safe">
              
              {/* Handle bar */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              {/* Product name */}
              <div className="px-6 pt-2 pb-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">الصنف المحدد</p>
                <h3 className="font-black text-2xl text-slate-900">{product?.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">سعر الكيلو: <span className="text-blue-600">{product?.price} ج.م</span></p>
              </div>

              {/* Live price preview */}
              <div className="mx-6 mb-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs font-bold">الوزن المحدد</p>
                  <p className="text-white font-black text-3xl">{kg > 0 ? `${kg} كجم` : "—"}</p>
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs font-bold">الإجمالي</p>
                  <p className="text-white font-black text-3xl">{kg > 0 ? `${total} ج.م` : "—"}</p>
                </div>
              </div>

              {/* Preset weight buttons */}
              <div className="px-6 mb-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">اختر وزناً سريعاً</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((w) => (
                    <button
                      key={w}
                      onClick={() => handleWeightChange(String(w), product?.price || 0)}
                      className={`py-3.5 rounded-2xl font-black text-base transition-all active:scale-95 ${
                        kg === w
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105"
                          : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {w} كجم
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider */}
              <div className="px-6 mb-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">أو حرك الشريط</p>
                <div className="relative px-1">
                  <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.25"
                    value={weightInput.weight || "0.25"}
                    onChange={(e) => handleWeightChange(e.target.value, product?.price || 0)}
                    className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                    style={{ direction: "ltr" }}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400">
                    <span>ربع كيلو</span>
                    <span>نص كيلو</span>
                    <span>1 كجم</span>
                    <span>1.5 كجم</span>
                    <span>2 كجم</span>
                  </div>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="px-6 mb-5 grid grid-cols-2 gap-4">
                {/* Manual weight input */}
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الوزن (كجم)</p>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={weightInput.weight}
                      onChange={(e) => handleWeightChange(e.target.value, product?.price || 0)}
                      onKeyDown={(e) => e.key === "Enter" && handleWeightSubmit()}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-xl font-black text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">كجم</div>
                  </div>
                </div>

                {/* Manual money input */}
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">المبلغ (جنيه)</p>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={weightInput.moneyAmount}
                      onChange={(e) => handleMoneyChange(e.target.value, product?.price || 0)}
                      onKeyDown={(e) => e.key === "Enter" && handleWeightSubmit()}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-xl font-black text-blue-600 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">ج.م</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={handleWeightSubmit}
                  disabled={kg <= 0}
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-white font-black text-lg transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                >
                  ✅ تأكيد {kg > 0 ? `${kg} كجم` : ""}
                </button>
                <button
                  onClick={() => { setWeightInput(null); barcodeRef.current?.focus(); }}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 font-black transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        );
      })()}



      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="font-bold text-xl text-gray-900 mb-6">تأكيد الدفع</h3>

            <div className="mb-4">
              <div className="flex flex-col gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => cart.setOrderType("shop")}
                  className={`w-full py-2 text-sm font-bold rounded-lg transition-colors ${cart.orderType === "shop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  بيع من المحل (بدون دليفري)
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => { cart.setOrderType("delivery"); cart.setDeliveryFee(5); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${cart.orderType === "delivery" && cart.deliveryFee === 5 ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    دليفري قريب (+5 ج)
                  </button>
                  <button
                    onClick={() => { cart.setOrderType("delivery"); cart.setDeliveryFee(10); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${cart.orderType === "delivery" && cart.deliveryFee === 10 ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    دليفري بعيد (+10 ج)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">المجموع:</span>
                <span className="font-bold text-gray-900">{formatPrice(cart.getTotal())}</span>
              </div>
              {cart.orderType === "delivery" && (
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">التوصيل:</span>
                  <span className="font-bold text-gray-900">{formatPrice(cart.getDeliveryFee())}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">الخصم:</span>
                <span className="font-bold text-red-500">-{formatPrice(cart.discount)}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-700">الإجمالي:</span>
                <span className="font-bold text-xl text-blue-700">{formatPrice(cart.getFinalTotal())}</span>
              </div>
            </div>

            {/* Delivery Pilot Calculator */}
            {cart.orderType === "delivery" && (
              <div className="mb-5 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <h4 className="font-bold text-sm text-amber-800 mb-3 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  حساب وتسليم الطيار
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-700 mb-1.5">
                      الباقي الممنوح للطيار (الفكة اللي خارجة معاه):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={pilotChange}
                        onChange={(e) => setPilotChange(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-amber-200 rounded-xl pl-8 pr-4 py-2 outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 text-sm"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-500">جنية</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-amber-200/50 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>ثمن الأوردر الصافي (بدون دليفري):</span>
                      <span className="font-bold text-slate-800">{formatPrice(cart.getTotal() - cart.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الباقي مع الطيار (+):</span>
                      <span className="font-bold text-slate-800">+{formatPrice(pilotChange)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>عمولة الطيار / الدليفري (-):</span>
                      <span className="font-bold">-{formatPrice(cart.getDeliveryFee())}</span>
                    </div>
                    
                    <div className="mt-3 p-2.5 bg-amber-100/80 border border-amber-200 rounded-xl flex items-center justify-between text-sm">
                      <span className="font-black text-amber-900">المطلوب استلامه من الطيار:</span>
                      <span className="font-black text-base text-amber-900">
                        {formatPrice(Math.max(0, (cart.getTotal() - cart.discount + pilotChange) - cart.getDeliveryFee()))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="label block text-sm font-bold text-slate-700 mb-2">تسجيل الفاتورة باسم عميل (للنقاط والدليفري)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const c = customers.find(x => x.id === id);
                  setSelectedCustomer(c || null);
                }}
              >
                <option value="">-- زبون طياري (بدون تسجيل) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="label">طريقة الدفع</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => cart.setPaymentType("cash")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    cart.paymentType === "cash"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  كاش
                </button>
                <button
                  onClick={() => cart.setPaymentType("card")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    cart.paymentType === "card"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  فيزا
                </button>
                <button
                  onClick={() => cart.setPaymentType("credit")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    cart.paymentType === "credit"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  آجل (شكك)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleCheckout(true)}
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 rounded-xl font-bold text-white transition-colors shadow-lg flex items-center justify-center gap-2 text-base"
              >
                {isLoading ? <span className="animate-spin">⟳</span> : <Printer className="w-5 h-5" />}
                {isLoading ? "جاري الحفظ..." : "تأكيد وطباعة"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckout(false)}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl font-bold text-white transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? <span className="animate-spin">⟳</span> : <CreditCard className="w-4 h-4" />}
                  تأكيد فقط
                </button>
                <button
                  onClick={() => {
                    cart.clearCart();
                    setSelectedCustomer(null);
                    setPilotChange(0);
                    setShowCheckout(false);
                    toast.success("تم بدء فاتورة جديدة بنجاح!");
                  }}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 rounded-xl font-bold text-white transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  فاتورة جديدة
                </button>
              </div>

              <button
                onClick={() => setShowCheckout(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors text-xs"
              >
                إلغاء التراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt */}
      {showReceipt && lastInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div id="printable-receipt" className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-auto shadow-2xl print:shadow-none print:max-h-none print:w-[80mm] print:mx-auto print:p-0">
            <div className="text-center mb-2 border-b border-dashed border-gray-300 pb-2">
              <h2 className="text-xl font-black text-gray-900">ماركت أبناء سوهاج</h2>
              
              <div className="flex flex-col items-center gap-0 my-1 text-[12px] font-bold text-gray-700">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span dir="ltr">035551771</span>
                  <span>-</span>
                  <span dir="ltr">01224163621</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-900">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span dir="ltr">01211469399</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mt-0.5">فاتورة مبيعات</p>
              <p className="text-[10px] text-gray-400 font-mono">{lastInvoice.invoiceNo}</p>
              <p className="text-[10px] text-gray-400 mb-1">
                {new Date(lastInvoice.createdAt).toLocaleString("ar-EG")}
              </p>
              {lastInvoice.customer && (
                <div className="bg-gray-100 p-2 rounded-lg text-sm text-gray-700 font-bold">
                  العميل: {lastInvoice.customer.name}
                  <div className="text-xs font-normal mt-1">النقاط المكتسبة: {Math.floor(lastInvoice.finalTotal / 10)} نقطة</div>
                </div>
              )}
            </div>

            <div className="space-y-0.5 mb-2 text-[13px] font-medium leading-tight">
              {lastInvoice.items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium text-gray-900">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-1.5 space-y-0.5 text-[13px]">
              <div className="flex justify-between text-gray-700">
                <span>المجموع:</span>
                <span>{formatPrice(lastInvoice.total)}</span>
              </div>
              {lastInvoice.orderType === "delivery" && (
                <div className="flex justify-between text-gray-600">
                  <span>التوصيل:</span>
                  <span>{formatPrice(lastInvoice.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>الخصم:</span>
                <span>{formatPrice(lastInvoice.discount)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                <span>الإجمالي:</span>
                <span>{formatPrice(lastInvoice.finalTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>الدفع:</span>
                <span>{lastInvoice.paymentType === "cash" ? "كاش" : "فيزا"}</span>
              </div>
            </div>

            <div className="mt-2 text-center text-[10px] text-gray-500 border-t border-gray-200 pt-2 pb-1">
              شكراً لتعاملكم مع ماركت أبناء سوهاج
            </div>

            <div className="flex gap-2 mt-4 no-print">
              <button onClick={printReceipt} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                <Printer className="w-4 h-4" />
                طباعة
              </button>
              <button
                onClick={() => { setShowReceipt(false); barcodeRef.current?.focus(); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Add Modal ─── */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-bold">باركود غير مسجل</p>
                <h3 className="text-white font-black text-lg">إضافة صنف جديد</h3>
              </div>
              <button onClick={() => { setShowQuickAdd(false); barcodeRef.current?.focus(); }}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Barcode display */}
              {quickAddForm.barcode && (
                <div className="bg-slate-50 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                  <ScanLine className="w-4 h-4 text-slate-400" />
                  <span className="font-mono font-black text-slate-600 tracking-widest text-sm">{quickAddForm.barcode}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">اسم الصنف *</label>
                <input
                  ref={quickAddNameRef}
                  type="text"
                  value={quickAddForm.name}
                  onChange={e => setQuickAddForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && quickAddPriceRef.current?.focus()}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-base"
                  placeholder="اكتب اسم المنتج..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">سعر البيع *</label>
                <div className="relative">
                  <input
                    ref={quickAddPriceRef}
                    type="number"
                    step="0.01"
                    value={quickAddForm.price}
                    onChange={e => setQuickAddForm(f => ({ ...f, price: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleQuickSave()}
                    className="w-full px-4 py-4 pl-16 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-2xl text-emerald-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    placeholder="0.00"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">ج.م</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleQuickSave}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5">
                  ➕ حفظ وأضف للسلة
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); barcodeRef.current?.focus(); }}
                  className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Product Edit Modal ─── */}
      {editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center relative">
               <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-5 left-5 text-slate-500 hover:text-white"
               >
                 <X className="w-6 h-6" />
               </button>
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                 <Edit2 className="w-8 h-8 text-white" />
               </div>
               <h3 className="text-white font-black text-xl mb-1">{editingProduct.name}</h3>
               <p className="text-slate-400 text-sm font-bold">تعديل الاسم وسعر البيع الحالي</p>
            </div>
            
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">اسم الصنف</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all text-base text-right font-sans"
                  placeholder="اسم الصنف..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">سعر البيع الجديد</label>
                <div className="relative">
                  <input
                    ref={editPriceRef}
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleQuickProductUpdate()}
                    className="w-full px-6 py-4 pl-16 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-2xl text-center text-blue-600 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="0.00"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">ج.م</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleQuickProductUpdate}
                  disabled={isUpdatingPrice}
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {isUpdatingPrice ? <span className="animate-spin text-2xl">⟳</span> : null}
                  {isUpdatingPrice ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}