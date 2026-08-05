/**
 * Codeforces 比赛数据获取
 * 通过 Codeforces 官方 API (contest.list) 获取竞赛信息，
 * 而非爬取 HTML 页面，遵守 robots.txt 规范。
 *
 * API 文档: https://codeforces.com/apiHelp
 * 接口: GET https://codeforces.com/api/contest.list
 * 限制: 每秒最多 1 次请求
 */

import { createHttpClient } from "./http";

/** 最终返回的比赛数据 */
export interface CodeforcesContest {
  name: string;
  startTime: Date;
  duration: number; // 时长（分钟）
  url: string;
  platform: string;
}

/** API 原始响应的单条比赛 */
export interface CfApiContest {
  id: number;
  name: string;
  phase: string; // "BEFORE" | "CODING" | "FINISHED"
  durationSeconds: number;
  startTimeSeconds?: number;
}

/** API 响应结构 */
interface CfApiResponse {
  status: string;
  result: CfApiContest[];
}

// API 基础地址
const API_BASE = "https://codeforces.com/api";

/**
 * 将 API 原始数据过滤并转换为统一比赛格式（纯函数，可独立测试）
 * 仅保留 phase === "BEFORE" 且开始时间在未来的比赛，按开始时间升序。
 * @param apiContests - API 返回的原始比赛数组
 * @param now - 当前时间（可选，默认 Date.now()）
 */
export function transformContests(
  apiContests: CfApiContest[],
  now: Date = new Date()
): CodeforcesContest[] {
  return apiContests
    .filter((c) => c.phase === "BEFORE" && !!c.startTimeSeconds)
    .filter((c) => new Date(c.startTimeSeconds! * 1000) > now)
    .map((c) => ({
      name: c.name,
      startTime: new Date(c.startTimeSeconds! * 1000),
      duration: Math.round(c.durationSeconds / 60), // 秒转分钟
      url: `https://codeforces.com/contest/${c.id}`,
      platform: "Codeforces" as const,
    }))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 获取 Codeforces 比赛列表（通过官方 API）
 * @param maxCount - 可选，最多返回的场次数
 * @returns 未开始的比赛数组（仅 phase === "BEFORE"）
 */
export async function fetchCodeforcesContests(
  maxCount?: number
): Promise<CodeforcesContest[]> {
  const client = createHttpClient();

  const response = await client.get<CfApiResponse>(
    `${API_BASE}/contest.list`
  );

  // 检查 API 状态（非 OK 视为异常响应）
  if (response.data.status !== "OK") {
    throw new Error(
      `[Codeforces API] 响应状态异常: ${JSON.stringify(response.data)}`
    );
  }

  const contests = transformContests(response.data.result);

  // 限制返回数量（默认全部）
  if (maxCount && maxCount > 0) {
    return contests.slice(0, maxCount);
  }

  return contests;
}
