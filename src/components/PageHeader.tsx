"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Accent = "violet" | "cyan" | "emerald" | "amber" | "rose" | "indigo" | "slate";

const accentStyles: Record<Accent, string> = {
  violet: "from-violet-500 to-indigo-600 shadow-violet-500/30",
  cyan: "from-cyan-400 to-blue-600 shadow-cyan-500/30",
  emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/30",
  amber: "from-amber-400 to-orange-500 shadow-amber-500/30",
  rose: "from-rose-500 to-pink-600 shadow-rose-500/30",
  indigo: "from-indigo-500 to-violet-600 shadow-indigo-500/30",
  slate: "from-zinc-600 to-zinc-800 shadow-zinc-500/20",
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
  accent = "violet",
  actions,
  sticky = true,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`glass-header ${sticky ? "sticky top-0 z-20" : ""} no-print ${className}`}>
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/" className="back-btn" aria-label="العودة للرئيسية">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentStyles[accent]} shadow-lg flex items-center justify-center shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-zinc-100 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-zinc-500 font-semibold truncate">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{actions}</div>}
    </header>
  );
}
