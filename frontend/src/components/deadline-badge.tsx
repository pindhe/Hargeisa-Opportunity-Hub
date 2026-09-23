import { cn, deadlineInfo, type DeadlineTone } from "@/lib/utils";

const tones: Record<DeadlineTone, string> = {
  green: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  yellow: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  expired: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  open: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const dots: Record<DeadlineTone, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
  expired: "bg-stone-400",
  open: "bg-emerald-500",
};

export function DeadlineBadge({ days, className }: { days: number | null | undefined; className?: string }) {
  const info = deadlineInfo(days);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tones[info.tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[info.tone])} />
      {info.label}
    </span>
  );
}
