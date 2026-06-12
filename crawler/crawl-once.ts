/**
 * 单次爬取脚本（供 Windows 任务计划程序 / cron 调用）
 * 依次爬取 Codeforces + 洛谷，写入数据库后退出。
 * 
 * 用法: npx tsx --env-file=.env crawl-once.ts
 */
import { fetchCodeforcesContests } from "./spiders/codeforces";
import { fetchLuoguContests } from "./spiders/luogu";
import { runPipeline, disconnectPipeline, ContestInput } from "./pipeline";

async function main() {
  console.log(`[Crawl] ===== 开始 [${new Date().toISOString()}] =====`);

  let cfContests: ContestInput[] = [];
  let lgContests: ContestInput[] = [];

  try {
    cfContests = await fetchCodeforcesContests();
    console.log(`[Crawl] Codeforces: ${cfContests.length} 条`);
  } catch (e) {
    console.error("[Crawl] Codeforces 失败:", e);
  }

  try {
    lgContests = await fetchLuoguContests();
    console.log(`[Crawl] 洛谷: ${lgContests.length} 条`);
  } catch (e) {
    console.error("[Crawl] 洛谷失败:", e);
  }

  // 合并数据后一起写入
  try {
    const all = [...cfContests, ...lgContests];
    const result = await runPipeline(all);
    console.log(`[Crawl] 写入: 新增=${result.inserted}, 跳过=${result.skipped}`);
  } catch (e) {
    console.error("[Crawl] 管道写入失败:", e);
  }

  await disconnectPipeline();
  console.log(`[Crawl] ===== 结束 =====`);
}

main().catch(console.error);
