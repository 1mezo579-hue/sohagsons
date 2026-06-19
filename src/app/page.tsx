"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/hooks/useAuthStore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageBackground } from "@/components/PageBackground";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Store,
  ArrowLeft,
  LogOut,
  Wallet,
  Truck,
  Contact,
  RotateCcw,
  Settings,
  Sparkles,
} from "lucide-react";

const ALL_MODULES = [
  { title: "الكاشير", desc: "بيع سريع وفواتير", icon: ShoppingCart, href: "/cashier", glow: "group-hover:shadow-violet-500/25", iconBg: "from-violet-500 to-indigo-600", roles: ["admin", "manager", "cashier"] },
  { title: "المخزن", desc: "منتجات ومخزون", icon: Package, href: "/inventory", glow: "group-hover:shadow-emerald-500/25", iconBg: "from-emerald-400 to-teal-600", roles: ["admin", "manager"] },
  { title: "التقارير", desc: "مبيعات وأرباح", icon: BarChart3, href: "/reports", glow: "group-hover:shadow-amber-500/25", iconBg: "from-amber-400 to-orange-500", roles: ["admin", "manager"] },
  { title: "العملاء", desc: "ولاء ونقاط", icon: Users, href: "/customers", glow: "group-hover:shadow-cyan-500/25", iconBg: "from-cyan-400 to-blue-600", roles: ["admin", "manager", "cashier"] },
  { title: "الدليفري", desc: "توصيل وطباعة", icon: Truck, href: "/delivery", glow: "group-hover:shadow-sky-500/25", iconBg: "from-sky-400 to-blue-600", roles: ["admin", "manager", "cashier"] },
  { title: "المرتجع", desc: "إرجاع للمخزن", icon: RotateCcw, href: "/returns", glow: "group-hover:shadow-rose-500/25", iconBg: "from-rose-500 to-pink-600", roles: ["admin", "manager", "cashier"] },
  { title: "المصروفات", desc: "إيجار ورواتب", icon: Wallet, href: "/expenses", glow: "group-hover:shadow-red-500/25", iconBg: "from-red-500 to-rose-600", roles: ["admin", "manager"] },
  { title: "التجار", desc: "موردين ومشتريات", icon: Contact, href: "/traders", glow: "group-hover:shadow-zinc-500/25", iconBg: "from-zinc-500 to-zinc-700", roles: ["admin", "manager"] },
  { title: "الإعدادات", desc: "مستخدمين وصلاحيات", icon: Settings, href: "/users", glow: "group-hover:shadow-purple-500/25", iconBg: "from-purple-500 to-violet-600", roles: ["admin"] },
];

const roleLabel: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير الفرع",
  cashier: "كاشير",
};

export default function Home() {
  const router = useRouter();
  const { user, isChecked } = useRequireAuth();
  const logout = useAuthStore((s) => s.logout);

  if (!isChecked) return <LoadingScreen />;

  const visibleModules = ALL_MODULES.filter((m) => user && m.roles.includes(user.role));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";

  return (
    <main className="min-h-screen relative overflow-hidden">
      <PageBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500">ماركت أبناء سوهاج</p>
              <p className="text-sm font-black text-zinc-200">POS System</p>
            </div>
          </div>
          <div className="user-pill">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-300" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-zinc-100">{user?.name}</p>
              <p className="text-[10px] font-bold text-zinc-500">{roleLabel[user?.role || "cashier"]}</p>
            </div>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">لوحة التحكم</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-2">
            <span className="gradient-text">{greeting}، {user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-zinc-500 font-semibold text-sm sm:text-base">اختر القسم للبدء</p>
        </div>

        {/* Bento grid */}
        <div
          className={`grid gap-3 sm:gap-4 animate-stagger ${
            visibleModules.length <= 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
              : "grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {visibleModules.map((mod, i) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group outline-none ${i === 0 && visibleModules.length > 3 ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <div className={`bento-tile ${i === 0 ? "bento-tile-lg" : ""} group-hover:shadow-xl ${mod.glow}`}>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${mod.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <mod.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <ArrowLeft className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 group-hover:-translate-x-1 transition-all" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-zinc-100 mb-1">{mod.title}</h2>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-10 font-medium">
          ماركت أبناء سوهاج &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
