"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 animate-bounce">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4">عذراً، حدث خطأ غير متوقع</h2>
        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
          واجه النظام مشكلة تقنية بسيطة. لا تقلق، بياناتك آمنة. يمكنك محاولة إعادة التحميل أو العودة للرئيسية.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 text-lg"
          >
            <RefreshCcw className="w-5 h-5" />
            إعادة المحاولة الآن
          </button>
          
          <Link
            href="/"
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Home className="w-5 h-5" />
            العودة لشاشة التحكم
          </Link>
        </div>
        
        <div className="mt-10 pt-8 border-t border-slate-50 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Error Digest: {error.digest || "Internal System Error"}
        </div>
      </div>
    </div>
  );
}
