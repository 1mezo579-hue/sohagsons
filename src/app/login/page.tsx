"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageBackground } from "@/components/PageBackground";
import toast from "react-hot-toast";
import { Store, LogIn, User, Lock, Eye, EyeOff } from "lucide-react";

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
    if (isChecked && isLoggedIn) {
      router.replace("/");
    }
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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <PageBackground />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-[5.5rem] h-[5.5rem] mx-auto rounded-[1.35rem] bg-white/90 backdrop-blur shadow-soft flex items-center justify-center mb-6 border border-white">
            <Store className="w-11 h-11 text-blue-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">أبناء سوهاج</h1>
          <p className="text-base sm:text-lg text-slate-500 font-bold">تسجيل الدخول للنظام</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel !rounded-[1.75rem] space-y-5">
          <div>
            <label className="label flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
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
              <Lock className="w-4 h-4 text-blue-500" />
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3">
            {isLoading ? (
              <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8 font-medium">ماركت أبناء سوهاج &copy; {new Date().getFullYear()}</p>
      </div>
    </main>
  );
}
