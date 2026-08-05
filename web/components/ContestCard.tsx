/**
 * ContestCard 竞赛卡片组件
 * 用于展示单条竞赛信息的卡片，包含：
 * - 平台 Logo + 平台徽章
 * - 比赛名称、开始时间、时长
 * - 距离比赛开始的倒计时
 * - 跳转链接
 */
import { Clock } from "lucide-react";
import { getPlatformColor, getPlatformLogo, getLogoSizeClass } from "@/lib/platforms";
import {
  formatDuration,
  formatStartTime,
  getCountdown,
  getCountdownColor,
  type Severity,
} from "@/lib/utils";
import type { ContestData } from "@/lib/contest";

export type { ContestData };

/** ContestCard 组件 Props */
export interface ContestCardProps {
  contest: ContestData;
}

/**
 * ContestCard 组件
 * 渲染单条竞赛信息的卡片
 */
export function ContestCard({ contest }: ContestCardProps) {
  const { name, platform, startTime, duration, url } = contest;
  const logoSrc = getPlatformLogo(platform);
  const countdown = getCountdown(startTime);

  return (
    <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
      {/* 平台 Logo + 平台徽章 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getPlatformColor(platform)}`}
        >
          {logoSrc && (
            <img
              src={logoSrc}
              alt={`${platform} Logo`}
              className={`${getLogoSizeClass(platform)} object-contain`}
            />
          )}
          {platform}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getCountdownColor(countdown.severity as Severity)}`}
        >
          {countdown.severity !== "normal" && (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
          {countdown.text}
        </span>
      </div>

      {/* 比赛名称 */}
      <h3 className="mb-3 line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
        {name}
      </h3>

      {/* 开始时间 */}
      <p className="text-sm text-muted-foreground">
        {formatStartTime(startTime, { showYear: true })}
      </p>

      {/* 时长 */}
      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {formatDuration(duration)}
      </div>

      {/* 比赛链接 */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        前往参赛
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  );
}
