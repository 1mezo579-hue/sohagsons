"use client";

type Accent = "violet" | "cyan" | "emerald" | "amber" | "rose";

const accentMap: Record<Accent, string> = {
  violet: "border-violet-500",
  cyan: "border-cyan-400",
  emerald: "border-emerald-400",
  amber: "border-amber-400",
  rose: "border-rose-400",
};

export function LoadingScreen({ accent = "violet" }: { accent?: Accent }) {
  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className={`w-12 h-12 border-[3px] ${accentMap[accent]} border-t-transparent rounded-full animate-spin`} />
      <p className="text-sm font-bold text-zinc-500 animate-pulse">جاري التحميل...</p>
    </div>
  );
}
