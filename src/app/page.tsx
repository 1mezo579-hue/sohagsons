"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/hooks/useAuthStore";
import { ShoppingCart, Package, BarChart3, Users, Store, ChevronLeft, LogOut, Wallet, Truck, Contact } from "lucide-react";

const ALL_MODULES = [
  {
    title: "الكاشير",
    desc: "إتمام عمليات البيع وإصدار الفواتير",
    icon: ShoppingCart,
    href: "/cashier",
    bg: "from-blue-600 to-blue-700",
    shadow: "shadow-blue-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "المخزن",
    desc: "إدارة المنتجات والأقسام والمخزون",
    icon: Package,
    href: "/inventory",
    bg: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "التقارير",
    desc: "تقارير المبيعات والأرباح والتحليلات",
    icon: BarChart3,
    href: "/reports",
    bg: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "العملاء",
    desc: "إدارة العملاء ونقاط الولاء والدليفري",
    icon: Truck,
    href: "/customers",
    bg: "from-indigo-500 to-purple-600",
    shadow: "shadow-indigo-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "المصروفات",
    desc: "تسجيل الإيجار والكهرباء والرواتب",
    icon: Wallet,
    href: "/expenses",
    bg: "from-rose-500 to-red-600",
    shadow: "shadow-red-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "التجار",
    desc: "حسابات الموردين وفواتير الشراء",
    icon: Contact,
    href: "/traders",
    bg: "from-slate-700 to-slate-900",
    shadow: "shadow-slate-700/30",
    roles: ["admin", "manager"],
  },
  {
    title: "الإعدادات",
    desc: "إدارة المستخدمين والصلاحيات",
    icon: Users,
    href: "/users",
    bg: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/30",
    roles: ["admin"],
  },
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

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter modules based on user role
  const visibleModules = ALL_MODULES.filter(
    (m) => user && m.roles.includes(user.role)
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-amber-300/8 blur-[100px]" />
      </div>

      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-5 border border-slate-100">
            <Store className="w-10 h-10 text-slate-800" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">أبناء سوهاج</h1>
          <p className="text-base text-slate-400 font-bold mb-6">نظام نقطة البيع وإدارة المخزن</p>

          {/* User Info Bar */}
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="font-black text-slate-900 text-sm">{user?.name}</div>
              <div className="text-[11px] font-bold text-slate-400">{roleLabel[user?.role || "cashier"]}</div>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className={`grid gap-5 ${visibleModules.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-2"}`}>
          {visibleModules.map((mod) => (
            <Link key={mod.href} href={mod.href} className="group outline-none">
              <div className="bg-white/80 backdrop-blur-xl rounded-[1.75rem] p-6 border border-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-2 flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mod.bg} shadow-lg ${mod.shadow} flex items-center justify-center shrink-0 group-hover:scale-110 group-active:scale-95 transition-transform duration-300`}>
                  <mod.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xl text-slate-900 mb-0.5">{mod.title}</div>
                  <div className="text-[13px] font-medium text-slate-400 truncate">{mod.desc}</div>
                </div>
                <ChevronLeft className="w-6 h-6 text-slate-300 group-hover:text-slate-600 group-hover:-translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-bold">
          جميع الحقوق محفوظة Design House Alex™ &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}