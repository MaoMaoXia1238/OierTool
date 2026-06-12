/**
 * 通用工具函数
 * 提供 cn() 函数（shadcn/ui 类名合并）以及竞赛相关的格式化工具函数。
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并多个 CSS 类名，自动处理 Tailwind 类名冲突
 * @param inputs - 要合并的类名列表
 * @returns 合并后的类名字符串
 * @example cn("px-4 py-2", "px-6") => "py-2 px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 倒计时严重程度 */
export type Severity = "danger" | "warning" | "normal";

/**
 * 格式化时长：将分钟数转为可读字符串
 * @param minutes - 时长（分钟）
 * @returns 格式化后的时长文案，如 "2 小时 30 分钟"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

/**
 * 格式化开始时间（存储为 UTC，显示为中国标准时间）
 * @param date - Date 对象或日期字符串
 * @param options.showYear - 是否显示年份（默认 false）
 * @returns 格式化的日期时间字符串
 */
export function formatStartTime(date: Date | string, options?: { showYear?: boolean }): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    ...(options?.showYear ? { year: "numeric" as const } : {}),
    month: "2-digit",
    day: "2-digit",
    weekday: options?.showYear ? undefined : ("short" as const),
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

/**
 * 计算距离比赛开始的倒计时
 * @param startTime - 比赛开始时间
 * @returns 包含倒计时文本和严重等级的对象
 */
export function getCountdown(startTime: Date | string): { text: string; severity: Severity } {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const diffMs = start.getTime() - Date.now();
  if (diffMs <= 0) return { text: "已开始", severity: "normal" };

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  // ≤ 1 天 → 红色，xx小时xx分钟（不足1小时用分钟）
  if (totalMinutes < 1440) {
    if (totalMinutes < 60) {
      return { text: minutes <= 5 ? "即将开始" : `${minutes} 分钟后`, severity: "danger" };
    }
    return {
      text: minutes > 0 ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`,
      severity: "danger",
    };
  }

  // ≤ 3 天 → 黄色
  if (days <= 3) {
    return { text: `${days} 天 ${hours} 小时`, severity: "warning" };
  }

  // > 3 天 → 普通
  return { text: `${days} 天`, severity: "normal" };
}

/** 倒计时徽章颜色（根据严重程度） */
export function getCountdownColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    normal: "bg-primary/10 text-primary",
  };
  return map[severity];
}
