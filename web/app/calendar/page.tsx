/**
 * 竞赛日历页面
 * 竞赛日历核心页面，集成 API 数据获取、平台筛选、实时倒计时和手动刷新。
 * 使用客户端组件实现筛选交互，倒计时每 30 秒自动刷新。
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Check, History, Info, RefreshCw } from "lucide-react";
import { ContestList } from "@/components/ContestList";
import { PushSubscribeButton } from "@/components/push-subscribe-button";
import { HintTooltip } from "@/components/hint-tooltip";
import type { ContestData } from "@/components/ContestCard";

/** 倒计时自动刷新间隔（毫秒） */
const COUNTDOWN_REFRESH_MS = 30_000;

/** 竞赛状态筛选 */
type ContestStatus = "upcoming" | "finished";

/**
 * 竞赛日历页面组件
 * 从 API 获取竞赛数据，支持按平台筛选、手动刷新和实时倒计时。
 */
export default function CalendarPage() {
  const [contests, setContests] = useState<ContestData[]>([]); // 所有比赛数据
  const [activePlatform, setActivePlatform] = useState<string>("全部"); // 当前选中平台
  const [status, setStatus] = useState<ContestStatus>("upcoming"); // 当前状态筛选
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(false); // 请求失败状态
  const [now, setNow] = useState(() => new Date()); // 实时时间（驱动倒计时刷新）
  const [lastUpdated, setLastUpdated] = useState<string>(""); // 最近更新时间
  const [refreshKey, setRefreshKey] = useState(0); // 手动刷新计数
  const [subscribed, setSubscribed] = useState(false); // 订阅链接已复制

  /**
   * 拉取竞赛数据（setState 均在异步回调中执行）
   */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 按状态拉取全部平台数据，平台筛选在客户端进行（保持 Tab 列表完整）
        const res = await fetch(`/api/contests?status=${status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ContestData[] = await res.json();
        if (cancelled) return;
        setContests(data);
        setLastUpdated(
          new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setError(false);
      } catch (err) {
        console.error("获取竞赛数据失败:", err);
        if (cancelled) return;
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, status, activePlatform]);

  // 每 30 秒刷新倒计时
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), COUNTDOWN_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // 手动刷新
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  /**
   * 复制订阅日历链接（带当前平台筛选）
   */
  const handleSubscribe = useCallback(async () => {
    const base = `${window.location.origin}/api/calendar.ics`;
    const url = activePlatform === "全部" ? base : `${base}?platform=${activePlatform}`;
    try {
      await navigator.clipboard.writeText(url);
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 2000);
    } catch {
      // 剪贴板不可用时静默失败
    }
  }, [activePlatform]);

  // 从比赛数据中提取所有不重复的平台，按字典序排列
  const platforms = useMemo(
    () => ["全部", ...[...new Set(contests.map((c) => c.platform))].sort()],
    [contests]
  );

  // 筛选后的比赛（客户端过滤，服务端仅按状态返回全部数据）
  const filtered = useMemo(
    () =>
      activePlatform === "全部"
        ? contests
        : contests.filter((c) => c.platform === activePlatform),
    [activePlatform, contests]
  );

  // 各平台比赛数量（用于筛选按钮角标）
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of platforms) {
      counts[p] =
        p === "全部"
          ? contests.length
          : contests.filter((c) => c.platform === p).length;
    }
    return counts;
  }, [platforms, contests]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
            <CalendarDays className="h-7 w-7 text-primary" />
            竞赛日历
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {loading
              ? "正在同步各平台竞赛数据..."
              : error
                ? "数据加载失败，请检查网络后重试"
                : status === "upcoming"
                  ? filtered.length > 0
                    ? `共 ${filtered.length} 场比赛即将开始 · 倒计时每 30 秒自动刷新`
                    : "当前没有即将开始的比赛"
                  : filtered.length > 0
                    ? `共 ${filtered.length} 场已结束的比赛`
                    : "暂无已结束的比赛记录"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground/70">
              更新于 {lastUpdated}
            </span>
          )}
          {status === "upcoming" && (
            <>
              <HintTooltip content="开启后，比赛开始前 15 分钟会在浏览器中收到通知提醒，不错过任何一场比赛。需要允许浏览器通知权限（仅 HTTPS 或本机访问支持）。">
                <PushSubscribeButton />
              </HintTooltip>
              <HintTooltip content="点击复制订阅链接，粘贴到 Google Calendar / Outlook / 苹果日历（添加日历 → 通过 URL 订阅），比赛信息将自动同步更新。">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {subscribed ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4" />
                      订阅日历
                    </>
                  )}
                </button>
              </HintTooltip>
            </>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 状态 Tab：即将开始 / 已结束 */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setStatus("upcoming")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            status === "upcoming"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          即将开始
        </button>
        <button
          type="button"
          onClick={() => setStatus("finished")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            status === "finished"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          已结束
        </button>
      </div>

      {/* 功能提示 */}
      {status === "upcoming" && (
        <p className="mb-6 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground/80">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            开启提醒：比赛开始前 15 分钟在浏览器中收到通知；
            订阅日历：一键同步到 Google 日历 / Outlook / 苹果日历，比赛自动更新。
          </span>
        </p>
      )}

      {/* 平台筛选 Tab */}
      <div className="mb-6 flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activePlatform === platform
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {platform}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                activePlatform === platform
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/70 text-muted-foreground"
              }`}
            >
              {platformCounts[platform] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* 请求失败提示 */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm">
          <span className="text-destructive">
            无法获取竞赛数据，请稍后重试或检查服务端爬虫是否正常运行。
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            重试
          </button>
        </div>
      )}

      {/* 比赛列表 */}
      <ContestList
        contests={filtered}
        loading={loading && contests.length === 0}
        now={now}
      />
    </div>
  );
}
