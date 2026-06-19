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
  ChevronLeft,
  LogOut,
  Wallet,
  Truck,
  Contact,
  RotateCcw,
  Settings,
} from "lucide-react";

const ALL_MODULES = [
  {
    title: "الكاشير",
    desc: "إتمام عمليات البيع وإصدار الفواتير",
    icon: ShoppingCart,
    href: "/cashier",
    accent: "from-blue-600 to-blue-700 shadow-blue-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "المخزن",
    desc: "إدارة المنتجات والأقسام والمخزون",
    icon: Package,
    href: "/inventory",
    accent: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "التقارير",
    desc: "تقارير المبيعات والأرباح والتحليلات",
    icon: BarChart3,
    href: "/reports",
    accent: "from-amber-500 to-orange-500 shadow-amber-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "العملاء",
    desc: "إدارة العملاء ونقاط الولاء",
    icon: Users,
    href: "/customers",
    accent: "from-indigo-500 to-purple-600 shadow-indigo-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "طلبات الدليفري",
    desc: "متابعة وتوصيل طلبات الدليفري النشطة",
    icon: Truck,
    href: "/delivery",
    accent: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "المرتجع",
    desc: "تسجيل المرتجعات وإعادتها للمخزون",
    icon: RotateCcw,
    href: "/returns",
    accent: "from-rose-600 to-rose-700 shadow-rose-500/30",
    roles: ["admin", "manager", "cashier"],
  },
  {
    title: "المصروفات",
    desc: "تسجيل الإيجار والكهرباء والرواتب",
    icon: Wallet,
    href: "/expenses",
    accent: "from-rose-500 to-red-600 shadow-red-500/30",
    roles: ["admin", "manager"],
  },
  {
    title: "التجار",
    desc: "حسابات الموردين وفواتير الشراء",
    icon: Contact,
    href: "/traders",
    accent: "from-slate-700 to-slate-900 shadow-slate-700/30",
    roles: ["admin", "manager"],
  },
  {
    title: "الإعدادات",
    desc: "إدارة المستخدمين والصلاحيات",
    icon: Settings,
    href: "/users",
    accent: "from-violet-500 to-purple-600 shadow-violet-500/30",
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

  if (!isChecked) return <LoadingScreen />;

  const visibleModules = ALL_MODULES.filter((m) => user && m.roles.includes(user.role));

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <PageBackground />

      <div className="w-full max-w-3xl animate-fade-in relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 mx-auto rounded-[1.25rem] bg-white/90 backdrop-blur shadow-soft flex items-center justify-center mb-5 border border-white">
            <Store className="w-9 h-9 sm:w-10 sm:h-10 text-blue-700" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">أبناء سوهاج</h1>
          <p className="text-sm sm:text-base text-slate-500 font-bold mb-6">نظام نقطة البيع وإدارة المخزن</p>

          <div className="inline-flex items-center gap-3 glass-panel py-3 px-4 sm:px-5 !rounded-2xl">
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
              className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>

        <div
          className={`grid gap-4 sm:gap-5 animate-stagger ${
            visibleModules.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {visibleModules.map((mod) => (
            <Link key={mod.href} href={mod.href} className="group outline-none">
              <div className="module-card flex items-center gap-4">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${mod.accent} shadow-lg flex items-center justify-center shrink-0 group-hover:scale-105 group-active:scale-95 transition-transform duration-300`}
                >
                  <mod.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg sm:text-xl text-slate-900 mb-0.5">{mod.title}</div>
                  <div className="text-xs sm:text-[13px] font-medium text-slate-400 line-clamp-2">{mod.desc}</div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-bold">
          ماركت أبناء سوهاج &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
