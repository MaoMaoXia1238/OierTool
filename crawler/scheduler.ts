/**
 * 定时任务调度器
 * 使用 node-cron 在每日 08:00 (北京时间) 自动执行竞赛数据爬取流程。
 * 执行顺序：Codeforces 爬取 → 洛谷爬取 → 数据管道写入
 * 单步失败不影响后续步骤。
 */

import cron from "node-cron";
import { fetchCodeforcesContests, CodeforcesContest } from "./spiders/codeforces";
import { fetchLuoguContests } from "./spiders/luogu";
import { runPipeline, ContestInput, disconnectPipeline } from "./pipeline";

/**
 * 获取 Codeforces 比赛数据（通过官方 API）
 * @returns 解析后的比赛数组，失败则返回空数组
 */
async function crawlCodeforces(): Promise<ContestInput[]> {
  try {
    console.log("[爬虫] 开始获取 Codeforces 比赛数据（API）...");
    const contests: CodeforcesContest[] = await fetchCodeforcesContests();
    console.log(`[爬虫] Codeforces 获取完成，共 ${contests.length} 条未开始比赛`);
    return contests;
  } catch (error) {
    console.error("[爬虫] Codeforces 获取失败:", error);
    return [];
  }
}

/**
 * 爬取洛谷比赛数据（Playwright 无头浏览器方案）
 * @returns 解析后的比赛数组，失败则返回空数组
 */
async function crawlLuogu(): Promise<ContestInput[]> {
  try {
    console.log("[爬虫] 开始爬取洛谷（Playwright）...");
    const contests = await fetchLuoguContests();
    console.log(`[爬虫] 洛谷爬取完成，共 ${contests.length} 条未开始比赛`);
    return contests;
  } catch (error) {
    console.error("[爬虫] 洛谷爬取失败:", error);
    return [];
  }
}

/**
 * 执行完整的爬取+写入流程
 * 依次爬取各平台数据，合并后通过管道写入数据库。
 */
async function runJob(): Promise<void> {
  const startTime = Date.now();
  console.log(`\n[Scheduler] ===== 定时任务开始 [${new Date().toISOString()}] =====`);

  // 依次爬取各平台（失败不影响后续步骤）
  const cfContests = await crawlCodeforces();
  const lgContests = await crawlLuogu();

  // 合并所有比赛数据
  const allContests: ContestInput[] = [...cfContests, ...lgContests];

  if (allContests.length === 0) {
    console.log("[Scheduler] 无新比赛数据，跳过写入步骤");
  } else {
    // 通过管道写入数据库
    console.log(`[Scheduler] 开始写入数据库，共 ${allContests.length} 条数据...`);
    const result = await runPipeline(allContests);
    console.log(
      `[Scheduler] 写入完成: 总数=${result.total}, 新增=${result.inserted}, 跳过(重复)=${result.skipped}`
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Scheduler] ===== 定时任务结束，耗时 ${elapsed}s =====\n`);
}

// 配置定时任务：每日 08:00 (北京时间，即 UTC 00:00) 执行
cron.schedule("0 0 * * *", async () => {
  await runJob();
});

console.log("[Scheduler] 定时调度器已启动，将在每日 08:00 (北京时间) 执行爬取任务");

// 进程退出时断开数据库连接
process.on("SIGINT", async () => {
  console.log("\n[Scheduler] 收到退出信号，正在清理...");
  await disconnectPipeline();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[Scheduler] 收到退出信号，正在清理...");
  await disconnectPipeline();
  process.exit(0);
});

// 导出 runJob 供手动触发或测试使用
export { runJob };
