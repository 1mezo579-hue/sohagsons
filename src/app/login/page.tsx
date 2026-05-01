"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import toast from "react-hot-toast";
import { Store, LogIn, User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn, login, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

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
        router.push("/");
      } else {
        toast.error(data.error || "فشل تسجيل الدخول");
      }
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-amber-400/8 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-100">
            <Store className="w-12 h-12 text-slate-800" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">أبناء سوهاج</h1>
          <p className="text-lg text-slate-400 font-bold">تسجيل الدخول للنظام</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: admin"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-12"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl font-bold text-white text-lg transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <span className="animate-spin text-2xl">⟳</span>
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8 font-medium">
          نظام إدارة سوبر ماركت أبناء سوهاج &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
