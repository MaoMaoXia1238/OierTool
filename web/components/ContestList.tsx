/**
 * ContestList 竞赛列表组件
 * 以表格列表形式渲染竞赛数据，支持三种状态：
 * - 加载中：显示骨架加载提示
 * - 空数据：显示「暂无比赛」
 * - 正常数据：渲染竞赛表格（窄屏横向滚动）
 */
import { type ContestData } from "@/components/ContestCard";
import { getPlatformLogo } from "@/lib/platforms";
import { formatDuration, formatStartTime, getCountdown, getCountdownColor, type Severity } from "@/lib/utils";

/** ContestList 组件 Props */
export interface ContestListProps {
  /** 比赛数据数组 */
  contests: ContestData[];
  /** 是否正在加载数据 */
  loading?: boolean;
}

/** 表格列宽 */
const GRID_COLS = "grid-cols-[4fr_1fr_1fr_1fr_0.8fr]";

/** 表头行 */
function TableHeader() {
  return (
    <div className={"hidden border-b bg-muted/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid " + GRID_COLS}>
      <div>比赛</div>
      <div className="text-center">时间</div>
      <div className="text-center">时长</div>
      <div className="text-center">倒计时</div>
      <div className="text-center">操作</div>
    </div>
  );
}

/** Logo 容器（固定宽度，统一协调各平台 logo 比例差异） */
function LogoCell({ src, platform }: { src?: string; platform: string }) {
  return (
    <div className="flex h-10 w-20 shrink-0 items-center justify-center rounded-md border bg-muted/40 px-1.5">
      {src ? (
        <img
          src={src}
          alt={platform}
          className="h-5 w-auto max-w-[68px] object-contain"
        />
      ) : (
        <span className="text-[10px] font-bold text-muted-foreground">
          {platform.slice(0, 2)}
        </span>
      )}
    </div>
  );
}

/**
 * ContestList 组件
 */
export function ContestList({ contests, loading = false }: ContestListProps) {
  // 加载状态
  if (loading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <TableHeader />
        <div className="animate-pulse space-y-4 p-6">
          <p className="sr-only">加载中...</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-16 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
              <div className="h-8 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 空数据状态
  if (contests.length === 0) {
    return (
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <div className="min-w-[800px]">
          <TableHeader />
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <svg className="h-12 w-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">暂无比赛</p>
            <p className="text-xs text-muted-foreground/60">爬虫定时更新，请稍后查看</p>
          </div>
        </div>
      </div>
    );
  }

  // 正常渲染
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <div>
        <TableHeader />

        <div className="divide-y">
          {contests.map((contest) => {
            const logoSrc = getPlatformLogo(contest.platform);
            const countdown = getCountdown(contest.startTime);

            return (
              <div
                key={contest.id}
                className={
                  "group flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/30 sm:grid sm:items-center sm:gap-0 sm:px-6 sm:py-4 " +
                  GRID_COLS
                }
              >
                {/* 比赛信息（名称 + 平台） */}
                <div className="flex items-center gap-3 min-w-0">
                  <LogoCell src={logoSrc} platform={contest.platform} />
                  <div className="min-w-0">
                    <div className="group relative w-fit max-w-full">
                      <div className="truncate text-sm font-semibold">
                        {contest.name}
                      </div>
                      <div className="pointer-events-none absolute bottom-full left-0 mb-1 hidden w-max max-w-xs rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md group-hover:block z-10" aria-hidden="true">
                        {contest.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 时间 */}
                <div className="hidden text-center text-sm text-muted-foreground sm:block">
                  {formatStartTime(contest.startTime)}
                </div>

                {/* 时长 */}
                <div className="hidden text-center text-sm text-muted-foreground sm:block">
                  {formatDuration(contest.duration)}
                </div>

                {/* 倒计时 */}
                <div className="hidden sm:flex sm:items-center sm:justify-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${getCountdownColor(countdown.severity)}`}
                  >
                    {countdown.severity !== "normal" && (
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                    {countdown.text}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-center gap-2">
                  <a href={contest.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    参赛
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>

                  {/* 移动端 */}
                  <div className="ml-auto flex items-center gap-3 text-xs sm:hidden">
                    <span className="text-muted-foreground">{formatStartTime(contest.startTime)}</span>
                    <span className={
                      countdown.severity === "danger" ? "font-semibold text-red-600" :
                      countdown.severity === "warning" ? "font-semibold text-yellow-600" :
                      "font-medium text-primary"
                    }>
                      {countdown.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
