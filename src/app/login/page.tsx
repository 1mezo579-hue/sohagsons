"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageBackground } from "@/components/PageBackground";
import toast from "react-hot-toast";
import { Store, LogIn, User, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn, isChecked, login, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isChecked && isLoggedIn) router.replace("/");
  }, [isChecked, isLoggedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        toast.success(`مرحباً ${data.name}!`);
        router.replace("/");
      } else {
        toast.error(data.error || "فشل تسجيل الدخول");
      }
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChecked) return <LoadingScreen />;

  return (
    <main className="min-h-screen flex relative overflow-hidden">
      <PageBackground />

      {/* Decorative panel — desktop */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12">
        <div className="max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 gradient-text">أبناء سوهاج</h1>
          <p className="text-zinc-400 text-lg font-semibold leading-relaxed mb-8">
            نظام نقطة بيع عصري لإدارة المبيعات والمخزون والتقارير في مكان واحد.
          </p>
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">سريع • آمن • متصل بالسحابة</span>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4">
              <Store className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text">أبناء سوهاج</h1>
          </div>

          <div className="glass-panel !rounded-3xl border-violet-500/20" style={{ animation: "pulseGlow 4s ease-in-out infinite" }}>
            <h2 className="text-xl font-black text-zinc-100 mb-1">تسجيل الدخول</h2>
            <p className="text-sm text-zinc-500 font-semibold mb-6">أدخل بيانات حسابك للمتابعة</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-400" />
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="input text-lg font-bold"
                  autoFocus
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400" />
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-lg font-bold pl-12"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 mt-2">
                {isLoading ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-6 h-6" />
                )}
                {isLoading ? "جاري الدخول..." : "دخول"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
