/**
 * OierTool - 首页组件（服务端组件）
 * 产品首页：品牌 Hero、数据统计、即将开始的比赛预览、功能特性与 CTA。
 * 比赛预览直接从数据库读取（动态渲染），数据库不可用时优雅降级隐藏该区块。
 */
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Database,
  Layers,
  Rocket,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getPlatformColor,
  getPlatformLogo,
  getLogoSizeClass,
} from "@/lib/platforms";
import {
  formatStartTime,
  getCountdown,
  getCountdownColor,
  type Severity,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 首页预览用比赛数据类型 */
interface PreviewContest {
  id: string;
  name: string;
  platform: string;
  startTime: Date;
  duration: number;
  url: string;
}

/** 功能特性列表 */
const FEATURES = [
  {
    icon: <Layers className="h-6 w-6" />,
    title: "多平台追踪",
    description: "同时追踪 Codeforces、AtCoder、洛谷、牛客、LeetCode 五大主流竞赛平台",
    gradient: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "智能倒计时",
    description: "直观展示距离比赛开始的时间，按紧迫程度分级着色提醒",
    gradient: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: "数据持久化",
    description: "基于 PostgreSQL 存储，历史数据随时可查，爬虫每日自动同步",
    gradient: "from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "开源免费",
    description: "MIT 开源协议，社区驱动，欢迎贡献你的想法与代码",
    gradient: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
  },
] as const;

/** 平台展示列表 */
const PLATFORMS = ["Codeforces", "AtCoder", "Luogu", "NowCoder", "LeetCode"] as const;

/**
 * 读取首页预览用的即将开始的比赛（最多 3 场）及总数
 * 数据库不可用时返回空数据，页面优雅降级
 */
async function getUpcomingContests(): Promise<{
  contests: PreviewContest[];
  total: number;
}> {
  try {
    const where = { startTime: { gt: new Date() } as const };
    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        orderBy: { startTime: "asc" },
        take: 3,
        select: {
          id: true,
          name: true,
          platform: true,
          startTime: true,
          duration: true,
          url: true,
        },
      }),
      prisma.contest.count({ where }),
    ]);
    return {
      contests: contests.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        startTime: c.startTime,
        duration: c.duration,
        url: c.url ?? "",
      })),
      total,
    };
  } catch {
    return { contests: [], total: 0 };
  }
}

/**
 * 首页组件
 */
export default async function Home() {
  const { contests, total } = await getUpcomingContests();

  return (
    <div className="relative z-10 flex flex-col items-center overflow-hidden">
      {/* ===== Hero 区域 ===== */}
      <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center gap-8 px-4 pt-16 pb-20 text-center">
        {/* 背景光晕 */}
        <div className="aurora-blob animate-aurora top-10 left-[10%] h-72 w-72 bg-blue-400/30 dark:bg-blue-500/15" />
        <div className="aurora-blob animate-aurora top-40 right-[8%] h-80 w-80 bg-violet-400/25 dark:bg-violet-500/15 [animation-delay:-4s]" />
        <div className="aurora-blob animate-aurora bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 bg-sky-300/25 dark:bg-sky-500/10 [animation-delay:-9s]" />

        {/* 品牌 Logo */}
        <div className="animate-float flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/30">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.6}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.023 6.023 0 01-2.77-.896m0 0a6.023 6.023 0 01-2.77-.896"
            />
          </svg>
        </div>

        {/* 标题与副标题 */}
        <div className="space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            五大主流 OJ 竞赛一站式聚合
          </span>
          <h1 className="bg-gradient-to-r from-foreground via-foreground/85 to-foreground/55 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            OierTool
          </h1>
          <p className="text-lg font-medium text-muted-foreground sm:text-xl">
            算法竞赛选手的随身工具站
          </p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground/75 sm:text-base">
            追踪 Codeforces、AtCoder、洛谷等平台的最新竞赛，再也不用错过任何一场比赛
          </p>
        </div>

        {/* CTA 按钮 */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/35 active:scale-95"
          >
            <CalendarDays className="h-5 w-5" />
            查看竞赛日历
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3 text-base font-semibold text-foreground transition-all hover:scale-105 hover:border-primary/40 active:scale-95"
          >
            浏览 API 文档
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 平台 Logo 展示 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {PLATFORMS.map((p) => (
            <span
              key={p}
              className="flex items-center gap-2 rounded-full border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
            >
              <img
                src={getPlatformLogo(p)}
                alt={p}
                className={`${getLogoSizeClass(p)} object-contain`}
              />
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ===== 数据统计条 ===== */}
      <section className="w-full max-w-4xl px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:grid-cols-4 sm:p-8">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-foreground sm:text-2xl">5 个</span>
            <span className="text-sm text-muted-foreground">已追踪平台</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-xl font-bold text-foreground sm:text-2xl">
              {total > 0 ? `${total}+` : "--"}
            </span>
            <span className="text-sm text-muted-foreground">即将开始</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span className="text-xl font-bold text-foreground sm:text-2xl">每日</span>
            <span className="text-sm text-muted-foreground">数据自动同步</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-xl font-bold text-foreground sm:text-2xl">MIT</span>
            <span className="text-sm text-muted-foreground">开源协议</span>
          </div>
        </div>
      </section>

      {/* ===== 即将开始的比赛预览 ===== */}
      {contests.length > 0 && (
        <section className="w-full max-w-4xl px-4 pt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                即将开始
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                最近 {contests.length} 场比赛 · 共 {total} 场待开赛
              </p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {contests.map((contest) => {
              const countdown = getCountdown(contest.startTime);
              return (
                <a
                  key={contest.id}
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getPlatformColor(contest.platform)}`}
                    >
                      <img
                        src={getPlatformLogo(contest.platform)}
                        alt={contest.platform}
                        className={`${getLogoSizeClass(contest.platform)} object-contain`}
                      />
                      {contest.platform}
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
                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {contest.name}
                  </h3>
                  <p className="mt-auto text-xs text-muted-foreground">
                    {formatStartTime(contest.startTime, { showYear: true })}
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== 功能特性卡片 ===== */}
      <section className="w-full max-w-5xl px-4 pt-16 pb-24">
        <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
          核心功能
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md sm:p-8"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} transition-transform group-hover:scale-110`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA 横幅 ===== */}
      <section className="w-full max-w-5xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center shadow-sm sm:p-12">
          <div className="aurora-blob -right-10 -top-10 h-48 w-48 bg-primary/20" />
          <h2 className="relative text-2xl font-bold text-foreground sm:text-3xl">
            准备迎接下一场比赛？
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            所有竞赛信息实时同步，倒计时精准提醒，让你专注备战，绝不错过任何一场关键比赛。
          </p>
          <Link
            href="/calendar"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            <CalendarDays className="h-5 w-5" />
            立即查看竞赛日历
          </Link>
        </div>
      </section>
    </div>
  );
}
