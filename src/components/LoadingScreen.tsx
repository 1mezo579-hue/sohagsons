"use client";

interface LoadingScreenProps {
  accent?: "blue" | "amber" | "emerald" | "indigo" | "rose" | "slate";
}

const accentMap = {
  blue: "border-blue-600",
  amber: "border-amber-500",
  emerald: "border-emerald-500",
  indigo: "border-indigo-500",
  rose: "border-rose-500",
  slate: "border-slate-600",
};

export function LoadingScreen({ accent = "blue" }: LoadingScreenProps) {
  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className={`w-11 h-11 border-[3px] ${accentMap[accent]} border-t-transparent rounded-full animate-spin`} />
      <p className="text-sm font-bold text-slate-400 animate-pulse">جاري التحميل...</p>
    </div>
  );
}
