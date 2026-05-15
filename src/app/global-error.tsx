"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 animate-bounce">
              <AlertCircle className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4">خطأ جسيم في النظام</h2>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed">
              حدث خطأ غير متوقع في جدار النظام الأساسي.
            </p>

            <button
              onClick={() => reset()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 text-lg"
            >
              <RefreshCcw className="w-5 h-5" />
              إعادة تحميل النظام
            </button>
            
            <div className="mt-10 pt-8 border-t border-slate-50 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Error Digest: {error.digest || "Internal Global Error"}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
