/**
 * 单次爬取脚本（供定时任务 / Docker 调用）
 * 并行爬取 Codeforces + 洛谷 + 牛客 + AtCoder + LeetCode，写入数据库后退出。
 *
 * 用法: npx tsx --env-file=.env crawl-once.ts
 */
import { crawlAllPlatforms } from "./crawl";
import { runPipeline, disconnectPipeline } from "./pipeline";

async function main(): Promise<void> {
  console.log(`[Crawl] ===== 开始 [${new Date().toISOString()}] =====`);

  const results = await crawlAllPlatforms();

  for (const result of results) {
    if (result.error) {
      console.error(`[Crawl] ${result.platform} 失败: ${result.error}`);
    } else {
      console.log(`[Crawl] ${result.platform}: ${result.contests.length} 条`);
    }
  }

  // 合并全部平台数据后一起写入
  const all = results.flatMap((r) => r.contests);
  try {
    const pipelineResult = await runPipeline(all);
    console.log(
      `[Crawl] 写入: 总数=${pipelineResult.total}, 新增=${pipelineResult.inserted}, 跳过(重复)=${pipelineResult.skipped}`
    );
  } catch (e) {
    console.error("[Crawl] 管道写入失败:", e);
    process.exitCode = 1;
  } finally {
    await disconnectPipeline();
  }

  console.log(`[Crawl] ===== 结束 =====`);
}

main().catch((error) => {
  console.error("[Crawl] 未预期的致命错误:", error);
  process.exit(1);
});
