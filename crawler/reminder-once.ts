/**
 * 单次比赛提醒检查脚本（供 GitHub Actions 定时任务调用）
 * 仅查询 15 分钟内开始且未提醒过的比赛，并调用 web 内部接口触发推送；
 * 不爬取任何竞赛网页，适合每 15 分钟运行一次。
 *
 * 用法: npx tsx --env-file=.env reminder-once.ts
 */
import { runReminderCheck } from "./crawl";
import { disconnectPipeline } from "./pipeline";

async function main(): Promise<void> {
  console.log(`[Reminder] ===== 提醒检查开始 [${new Date().toISOString()}] =====`);

  const sent = await runReminderCheck();
  console.log(`[Reminder] 已触发 ${sent} 场比赛的提醒推送`);
  console.log(`[Reminder] ===== 提醒检查结束 =====`);
}

main()
  .catch((error) => {
    console.error("[Reminder] 未预期的致命错误:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPipeline();
  });
