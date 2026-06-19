"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Accent =
  | "blue"
  | "emerald"
  | "amber"
  | "indigo"
  | "cyan"
  | "rose"
  | "slate"
  | "purple";

const accentStyles: Record<Accent, string> = {
  blue: "from-blue-600 to-blue-700 shadow-blue-500/25",
  emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/25",
  indigo: "from-indigo-500 to-purple-600 shadow-indigo-500/25",
  cyan: "from-cyan-500 to-blue-600 shadow-cyan-500/25",
  rose: "from-rose-500 to-red-600 shadow-rose-500/25",
  slate: "from-slate-700 to-slate-900 shadow-slate-700/25",
  purple: "from-violet-500 to-purple-600 shadow-violet-500/25",
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: Accent;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  accent = "blue",
  actions,
  sticky = true,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`glass-header ${sticky ? "sticky top-0 z-20" : ""} no-print ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/" className="back-btn" aria-label="العودة للرئيسية">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accentStyles[accent]} shadow-lg flex items-center justify-center shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-semibold truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
