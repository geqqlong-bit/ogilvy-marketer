import type { StepStatus } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function statusColor(status: StepStatus): string {
  switch (status) {
    case "done":    return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "running": return "text-amber-600 bg-amber-50 border-amber-200";
    case "error":   return "text-rose-600 bg-rose-50 border-rose-200";
    default:        return "text-slate-400 bg-slate-50 border-slate-200";
  }
}

export function statusDot(status: StepStatus): string {
  switch (status) {
    case "done":    return "bg-emerald-500";
    case "running": return "bg-amber-500 animate-pulse";
    case "error":   return "bg-rose-500";
    default:        return "bg-slate-300";
  }
}

export function statusLabel(status: StepStatus): string {
  switch (status) {
    case "done":    return "完成";
    case "running": return "执行中";
    case "error":   return "异常";
    default:        return "待执行";
  }
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  if (diff < minute)     return "刚刚";
  if (diff < hour)       return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day)        return `${Math.floor(diff / hour)} 小时前`;
  if (diff < day * 30)   return `${Math.floor(diff / day)} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export function slugToName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function completionPercent(steps: Record<string, StepStatus>): number {
  const vals = Object.values(steps);
  if (vals.length === 0) return 0;
  const done = vals.filter((s) => s === "done").length;
  return Math.round((done / vals.length) * 100);
}
