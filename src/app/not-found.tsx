"use client";

import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-8">
          <Search className="w-12 h-12" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4">الصفحة غير موجودة</h2>
        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
          عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. تأكد من العنوان أو عد للرئيسية.
        </p>

        <Link
          href="/"
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 text-lg"
        >
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
