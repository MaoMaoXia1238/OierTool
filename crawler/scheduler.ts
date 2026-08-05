/**
 * 定时任务调度器
 * 使用 node-cron 每日 08:00（北京时间，Asia/Shanghai）自动执行 5 大平台竞赛爬取。
 * 内置重叠保护：上一轮任务未完成时跳过本轮触发。
 */

import cron from "node-cron";
import { crawlAllPlatforms } from "./crawl";
import { runPipeline, disconnectPipeline } from "./pipeline";

/** 调度时区（北京时间） */
const CRON_TIMEZONE = "Asia/Shanghai";
/** 调度表达式：每日 08:00 */
const CRON_EXPRESSION = "0 8 * * *";

/** 任务是否正在执行（防止重叠） */
let running = false;

/**
 * 执行完整的爬取 + 写入流程
 */
async function runJob(): Promise<void> {
  if (running) {
    console.warn("[Scheduler] 上一轮任务仍在执行，跳过本轮触发");
    return;
  }
  running = true;

  const startTime = Date.now();
  console.log(
    `[Scheduler] ===== 定时任务开始 [${new Date().toISOString()}] =====`
  );

  try {
    // 并行爬取全部平台（单平台失败不影响其他）
    const results = await crawlAllPlatforms();

    for (const result of results) {
      if (result.error) {
        console.error(`[Scheduler] ${result.platform} 爬取失败: ${result.error}`);
      } else {
        console.log(
          `[Scheduler] ${result.platform}: ${result.contests.length} 条未开始比赛`
        );
      }
    }

    // 合并数据写入数据库
    const all = results.flatMap((r) => r.contests);
    if (all.length === 0) {
      console.log("[Scheduler] 无新比赛数据，跳过写入步骤");
    } else {
      const pipelineResult = await runPipeline(all);
      console.log(
        `[Scheduler] 写入完成: 总数=${pipelineResult.total}, 新增=${pipelineResult.inserted}, 跳过(重复)=${pipelineResult.skipped}`
      );
    }
  } catch (error) {
    console.error("[Scheduler] 任务执行失败:", error);
  } finally {
    running = false;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Scheduler] ===== 定时任务结束，耗时 ${elapsed}s =====\n`);
  }
}

// 配置定时任务：每日 08:00 (北京时间) 执行
cron.schedule(
  CRON_EXPRESSION,
  () => {
    void runJob();
  },
  { timezone: CRON_TIMEZONE }
);

console.log(
  `[Scheduler] 定时调度器已启动，将在每日 ${CRON_EXPRESSION}（${CRON_TIMEZONE}）执行爬取任务`
);

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
