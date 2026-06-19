"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type StatTone = "blue" | "emerald" | "amber" | "rose" | "indigo" | "slate";

const toneMap: Record<StatTone, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50 border-blue-100", icon: "text-blue-600 bg-blue-100" },
  emerald: { bg: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600 bg-emerald-100" },
  amber: { bg: "bg-amber-50 border-amber-100", icon: "text-amber-600 bg-amber-100" },
  rose: { bg: "bg-rose-50 border-rose-100", icon: "text-rose-600 bg-rose-100" },
  indigo: { bg: "bg-indigo-50 border-indigo-100", icon: "text-indigo-600 bg-indigo-100" },
  slate: { bg: "bg-slate-50 border-slate-100", icon: "text-slate-600 bg-slate-100" },
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "blue", hint }: StatCardProps) {
  const t = toneMap[tone];
  return (
    <div className={`stat-card ${t.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 truncate">{value}</p>
          {hint && <p className="text-[11px] font-semibold text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
