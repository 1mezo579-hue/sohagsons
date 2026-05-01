"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  ShoppingCart, Package, BarChart3, Users,
  Store, ChevronLeft, LogOut
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isLoggedIn, loadFromStorage, logout } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoggedIn && typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_user");
      if (!saved) {
        router.push("/login");
      }
    }
  }, [isLoggedIn, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!isLoggedIn) return null;

  const modules = [
    { title: "الكاشير", icon: ShoppingCart, href: "/cashier", bg: "bg-blue-600" },
    { title: "المخزن", icon: Package, href: "/inventory", bg: "bg-emerald-500" },
    { title: "التقارير", icon: BarChart3, href: "/reports", bg: "bg-amber-500" },
    { title: "الإعدادات", icon: Users, href: "/users", bg: "bg-rose-500" },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-200 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl animate-fade-in">
        {/* Header with user info */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-100">
            <Store className="w-10 h-10 text-slate-800" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">أبناء سوهاج</h1>
          <p className="text-lg text-slate-400 font-bold">نقطة بيع وإدارة مخزون</p>
          
          {/* User info bar */}
          <div className="mt-6 inline-flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-bold text-slate-700">{user?.name}</span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {user?.role === "admin" ? "مدير" : user?.role === "manager" ? "مدير فرع" : "كاشير"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <Link key={mod.title} href={mod.href} className="group block outline-none">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[1.5rem] ${mod.bg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-active:scale-95 shrink-0`}>
                  <mod.icon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-3xl font-black text-slate-800">{mod.title}</h2>
                  <ChevronLeft className="w-8 h-8 text-slate-300 group-hover:text-slate-800 transition-colors transform group-hover:-translate-x-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}