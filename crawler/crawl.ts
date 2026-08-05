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
import type { ContestInput } from "./pipeline";

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
  const settled = await Promise.allSettled(
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

  return settled.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { platform: "Unknown", contests: [], error: String(result.reason) }
  );
}
