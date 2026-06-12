/**
 * ContestCard 竞赛卡片组件
 * 用于展示单条竞赛信息的卡片，包含：
 * - 平台 Logo 图片
 * - 比赛名称、平台名称
 * - 开始时间、时长
 * - 距离比赛开始的倒计时
 * - 跳转链接
 */
import { getPlatformLogo } from "@/lib/platforms";
import { formatDuration, formatStartTime, getCountdown } from "@/lib/utils";

/** 单条比赛数据 */
export interface ContestData {
  id: string;
  name: string;
  platform: string;
  startTime: Date | string;
  duration: number; // 单位：分钟
  url: string;
}

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
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {/* 平台 Logo + 平台名称 */}
      <div className="mb-2 flex items-center gap-2">
        {logoSrc && (
          <img
            src={logoSrc}
            alt={`${platform} Logo`}
            className="h-6 w-6 object-contain"
          />
        )}
        <span className="text-sm text-muted-foreground">{platform}</span>
      </div>

      {/* 比赛名称 */}
      <h3 className="mb-1 text-lg font-semibold">{name}</h3>

      {/* 开始时间 */}
      <p className="text-sm text-muted-foreground">
        {formatStartTime(startTime, { showYear: true })}
      </p>

      {/* 时长 + 倒计时 */}
      <div className="mt-2 flex items-center gap-3 text-sm">
        <span>{formatDuration(duration)}</span>
        <span className="font-medium text-primary">{countdown.text}</span>
      </div>

      {/* 比赛链接 */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
      >
        前往参赛
      </a>
    </div>
  );
}
