/**
 * 定时任务调度器
 * 使用 node-cron 每日 08:00（北京时间，Asia/Shanghai）自动执行 5 大平台竞赛爬取。
 * 内置重叠保护：上一轮任务未完成时跳过本轮触发。
 */

import cron from "node-cron";
import { runCrawlJob, runReminderCheck } from "./crawl";
import { disconnectPipeline } from "./pipeline";

/** 调度时区（北京时间） */
const CRON_TIMEZONE = "Asia/Shanghai";
/** 每日全量爬取：08:00 */
const CRAWL_CRON = "0 8 * * *";
/** 轻量提醒检查：每 15 分钟（仅查库 + 推送，不爬网页） */
const REMINDER_CRON = "*/15 * * * *";

/** 任务是否正在执行（防止重叠） */
let running = false;

/**
 * 执行完整的爬取任务（爬取 → 写入 → 清理 → 日志）
 */
async function runJob(): Promise<void> {
  if (running) {
    console.warn("[Scheduler] 上一轮任务仍在执行，跳过本轮触发");
    return;
  }
  running = true;

  console.log(
    `[Scheduler] ===== 定时任务开始 [${new Date().toISOString()}] =====`
  );

  try {
    const { results, pipeline, cleanedUp, durationMs } = await runCrawlJob();

    for (const result of results) {
      if (result.error) {
        console.error(`[Scheduler] ${result.platform} 爬取失败: ${result.error}`);
      } else {
        console.log(
          `[Scheduler] ${result.platform}: ${result.contests.length} 条未开始比赛`
        );
      }
    }

    console.log(
      `[Scheduler] 写入完成: 总数=${pipeline.total}, 新增=${pipeline.inserted}, 跳过(重复)=${pipeline.skipped}, 非法丢弃=${pipeline.invalid}`
    );
    for (const [platform, message] of Object.entries(pipeline.errors)) {
      console.error(`[Scheduler] ${platform} 写库失败: ${message}`);
    }
    if (cleanedUp > 0) {
      console.log(`[Scheduler] 清理过期比赛: ${cleanedUp} 条`);
    }
    console.log(`[Scheduler] 耗时: ${(durationMs / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error("[Scheduler] 任务执行失败:", error);
  } finally {
    running = false;
    console.log(`[Scheduler] ===== 定时任务结束 =====\n`);
  }
}

// 配置定时任务：
// 1. 每日 08:00 (北京时间) 全量爬取 5 大平台
// 2. 每 15 分钟轻量提醒检查（比赛开始前 15 分钟推送通知）
cron.schedule(
  CRAWL_CRON,
  () => {
    void runJob();
  },
  { timezone: CRON_TIMEZONE }
);

cron.schedule(
  REMINDER_CRON,
  () => {
    void runReminderJob();
  },
  { timezone: CRON_TIMEZONE }
);

console.log(
  `[Scheduler] 定时调度器已启动：每日 ${CRAWL_CRON}（${CRON_TIMEZONE}）全量爬取，每 15 分钟检查比赛提醒`
);

/**
 * 轻量提醒任务：查询 15 分钟内开始的比赛并推送通知
 */
async function runReminderJob(): Promise<void> {
  try {
    const sent = await runReminderCheck();
    if (sent > 0) {
      console.log(`[Scheduler] 已触发 ${sent} 场比赛的提醒推送`);
    }
  } catch (error) {
    console.error("[Scheduler] 提醒检查失败:", error);
  }
}

// 进程退出时断开数据库连接
async function shutdown(signal: string): Promise<void> {
  console.log(`[Scheduler] 收到 ${signal}，正在清理...`);
  try {
    await disconnectPipeline();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

// 导出 runJob 供手动触发或测试使用
export { runJob };
