/**
 * 多平台爬取编排
 * 统一调度 5 大平台的爬虫，独立容错：单个平台失败不影响其他平台。
 * 供定时调度器（scheduler.ts）与单次爬取脚本（crawl-once.ts）共用。
 */

import { fetchCodeforcesContests } from "./spiders/codeforces";
import { fetchLuoguContests } from "./spiders/luogu";
import { fetchNowCoderContests } from "./spiders/nowcoder";
import { fetchAtCoderContests } from "./spiders/atcoder";
import { fetchLeetCodeContests } from "./spiders/leetcode";
import { createHttpClient } from "./spiders/http";
import {
  runPipeline,
  cleanupOldContests,
  getPrisma,
  type ContestInput,
  type PipelineResult,
  type PlatformPipelineResult,
} from "./pipeline";

/** 提醒窗口：比赛开始前 15 分钟内触发 Web Push 提醒 */
const REMINDER_WINDOW_MINUTES = 15;

/** 提醒推送内部接口超时（毫秒） */
const REMINDER_TIMEOUT_MS = 10_000;

/** 单个平台的爬取结果 */
export interface PlatformCrawlResult {
  platform: string;
  contests: ContestInput[];
  /** 该平台爬取失败时的错误信息 */
  error?: string;
}

/** 平台爬取任务定义 */
interface CrawlTask {
  platform: string;
  fetch: () => Promise<ContestInput[]>;
}

/** 全部平台任务（顺序即输出顺序） */
const CRAWL_TASKS: CrawlTask[] = [
  { platform: "Codeforces", fetch: fetchCodeforcesContests },
  { platform: "Luogu", fetch: fetchLuoguContests },
  { platform: "NowCoder", fetch: fetchNowCoderContests },
  { platform: "AtCoder", fetch: fetchAtCoderContests },
  { platform: "LeetCode", fetch: fetchLeetCodeContests },
];

/**
 * 并行爬取全部平台（allSettled 保证单平台失败不影响整体）
 * @returns 各平台爬取结果数组
 */
export async function crawlAllPlatforms(): Promise<PlatformCrawlResult[]> {
  // 每个 task.fetch 内部已经把 rejection 转换为 PlatformCrawlResult，
  // 因此这里直接 Promise.all 即可；allSettled 的兜底分支属于不可达死代码。
  return Promise.all(
    CRAWL_TASKS.map((task) =>
      task.fetch().then(
        (contests): PlatformCrawlResult => ({
          platform: task.platform,
          contests,
        }),
        (error: unknown): PlatformCrawlResult => ({
          platform: task.platform,
          contests: [],
          error: error instanceof Error ? error.message : String(error),
        })
      )
    )
  );
}

/**
 * 完整爬取任务结果
 */
export interface CrawlJobResult {
  results: PlatformCrawlResult[];
  pipeline: PipelineResult;
  cleanedUp: number;
  durationMs: number;
}

/**
 * 记录单次爬取日志（写入 crawl_logs 表，供监控页 / healthz 使用）
 */
async function recordCrawlLogs(
  results: PlatformCrawlResult[],
  pipeline: PipelineResult,
  durationMs: number
): Promise<void> {
  const client = getPrisma();
  const now = new Date();
  const emptyStats: PlatformPipelineResult = { total: 0, inserted: 0, skipped: 0 };

  const platformLogs = results.map((r) => {
    const stats = pipeline.platforms[r.platform] ?? emptyStats;
    const failed = Boolean(r.error || stats.error);
    return {
      platform: r.platform,
      status: failed ? "error" : "success",
      inserted: stats.inserted,
      skipped: stats.skipped,
      total: stats.total,
      error: r.error ?? stats.error ?? null,
      durationMs,
      createdAt: now,
    };
  });

  // 爬取失败或写库失败都算该平台失败；全部失败时汇总状态也必须为 error。
  const allFailed =
    results.length > 0 && platformLogs.every((log) => log.status === "error");

  await client.crawlLog.createMany({
    data: [
      ...platformLogs,
      {
        platform: "ALL",
        status: allFailed ? "error" : "success",
        inserted: pipeline.inserted,
        skipped: pipeline.skipped,
        total: pipeline.total,
        error: allFailed
          ? (platformLogs.find((log) => log.error)?.error ??
            "all platforms failed")
          : null,
        durationMs,
        createdAt: now,
      },
    ],
  });
}

/**
 * 向 15 分钟内开始的比赛发送 Web Push 提醒（通过 web 内部接口）
 * 仅推送未发送过提醒的比赛（reminderSentAt 为空），由 web 端标记去重。
 * 未配置 WEB_INTERNAL_URL / INTERNAL_API_SECRET 时跳过（如 CI 环境）。
 * @param context - 日志前缀（区分爬虫流程 / 定时提醒任务）
 * @returns 触发提醒的比赛数量
 */
async function sendContestReminders(context = "[Crawl]"): Promise<number> {
  const webUrl = process.env.WEB_INTERNAL_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!webUrl || !secret) {
    console.warn(
      `${context} 未配置 WEB_INTERNAL_URL / INTERNAL_API_SECRET，跳过比赛提醒推送`
    );
    return 0;
  }

  try {
    const client = getPrisma();
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000
    );

    // 查询 15 分钟内开始且未提醒过的比赛
    const contests = await client.contest.findMany({
      where: {
        startTime: { gt: now, lte: windowEnd },
        reminderSentAt: null,
      },
      select: { id: true },
    });

    if (contests.length === 0) return 0;

    const http = createHttpClient({ timeoutMs: REMINDER_TIMEOUT_MS });
    let sent = 0;
    for (const contest of contests) {
      try {
        await http.post(
          `${webUrl.replace(/\/$/, "")}/api/push/send`,
          { contestId: contest.id },
          { headers: { "x-internal-secret": secret } }
        );
        sent++;
      } catch (error) {
        console.error(
          `${context} 推送提醒失败（比赛 ${contest.id}）:`,
          error instanceof Error ? error.message : error
        );
      }
    }
    return sent;
  } catch (error) {
    console.error(`${context} 查询待提醒比赛失败:`, error);
    return 0;
  }
}

/**
 * 轻量提醒检查（不爬取网页，仅查询数据库 + 触发推送）
 * 供调度器高频执行（如每 15 分钟），保证比赛开始前及时提醒。
 * @returns 触发提醒的比赛数量
 */
export async function runReminderCheck(): Promise<number> {
  return sendContestReminders("[Reminder]");
}

/**
 * 执行完整爬取任务：并行爬取 → 批量写入 → 清理过期数据 → 记录日志 → 推送提醒
 * @returns 汇总结果（各平台结果、管道统计、清理数量、耗时）
 */
export async function runCrawlJob(): Promise<CrawlJobResult> {
  const startTime = Date.now();
  const results = await crawlAllPlatforms();
  const all = results.flatMap((r) => r.contests);

  const pipeline = await runPipeline(all);
  const cleanedUp = await cleanupOldContests();
  const durationMs = Date.now() - startTime;

  // 日志记录失败不影响主流程
  await recordCrawlLogs(results, pipeline, durationMs).catch((error) => {
    console.error("[Crawl] 记录爬虫日志失败:", error);
  });

  // 比赛提醒（同样 best-effort，失败不影响主流程）
  const reminded = await sendContestReminders();
  if (reminded > 0) {
    console.log(`[Crawl] 已触发 ${reminded} 场比赛的提醒推送`);
  }

  return { results, pipeline, cleanedUp, durationMs };
}
