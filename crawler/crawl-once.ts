/**
 * 单次爬取脚本（供定时任务 / Docker 调用）
 * 并行爬取 Codeforces + 洛谷 + 牛客 + AtCoder + LeetCode，批量写入后退出。
 *
 * 用法: npx tsx --env-file=.env crawl-once.ts
 */
import { runCrawlJob } from "./crawl";
import { disconnectPipeline } from "./pipeline";

async function main(): Promise<void> {
  console.log(`[Crawl] ===== 开始 [${new Date().toISOString()}] =====`);

  const { results, pipeline, cleanedUp, durationMs } = await runCrawlJob();

  for (const result of results) {
    if (result.error) {
      console.error(`[Crawl] ${result.platform} 失败: ${result.error}`);
    } else {
      console.log(`[Crawl] ${result.platform}: ${result.contests.length} 条`);
    }
  }

  console.log(
    `[Crawl] 写入: 总数=${pipeline.total}, 新增=${pipeline.inserted}, 跳过(重复)=${pipeline.skipped}`
  );
  if (cleanedUp > 0) {
    console.log(`[Crawl] 清理过期比赛: ${cleanedUp} 条`);
  }
  console.log(`[Crawl] 耗时: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`[Crawl] ===== 结束 =====`);
}

main()
  .catch((error) => {
    console.error("[Crawl] 未预期的致命错误:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPipeline();
  });
