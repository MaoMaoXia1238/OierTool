/**
 * 倒计时徽章（客户端组件）
 * 按距离比赛开始的时间自动调整刷新频率：
 * - 1 小时内：每秒刷新
 * - 其余时间：每 30 秒刷新
 * 用于首页预览、比赛卡片等静态内容中的实时倒计时。
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { getCountdown, getCountdownColor } from "@/lib/utils";

/** 紧急倒计时阈值（毫秒） */
const URGENT_THRESHOLD_MS = 60 * 60 * 1000;
/** 普通刷新间隔 */
const SLOW_REFRESH_MS = 30_000;
/** 紧急刷新间隔 */
const FAST_REFRESH_MS = 1_000;

export interface CountdownBadgeProps {
  startTime: Date | string;
  /** 额外的徽章样式类名 */
  className?: string;
  /** 是否显示状态小圆点 */
  showDot?: boolean;
}

export function CountdownBadge({
  startTime,
  className = "",
  showDot = true,
}: CountdownBadgeProps) {
  const [now, setNow] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const start = typeof startTime === "string" ? new Date(startTime) : startTime;
      const diffMs = start.getTime() - Date.now();
      const delay =
        diffMs <= URGENT_THRESHOLD_MS ? FAST_REFRESH_MS : SLOW_REFRESH_MS;
      timerRef.current = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [startTime]);

  const countdown = getCountdown(startTime, now);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap tabular-nums transition-colors ${getCountdownColor(countdown.severity)} ${className}`}
    >
      {showDot && countdown.severity !== "normal" && (
        <span
          className={`h-1.5 w-1.5 rounded-full bg-current ${
            countdown.severity === "danger" ? "animate-pulse" : ""
          }`}
        />
      )}
      {countdown.text}
    </span>
  );
}
