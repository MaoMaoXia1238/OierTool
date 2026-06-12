/**
 * Codeforces 比赛数据获取
 * 通过 Codeforces 官方 API (contest.list) 获取竞赛信息，
 * 而非爬取 HTML 页面，遵守 robots.txt 规范。
 *
 * API 文档: https://codeforces.com/apiHelp
 * 接口: GET https://codeforces.com/api/contest.list
 * 限制: 每秒最多 1 次请求
 */

import axios from "axios";

/** API 返回的比赛数据 */
export interface CodeforcesContest {
  name: string;
  startTime: Date;
  duration: number;    // 时长（分钟）
  url: string;
  platform: string;
}

/** API 原始响应的单条比赛 */
interface CfApiContest {
  id: number;
  name: string;
  phase: string;                    // "BEFORE" | "CODING" | "FINISHED"
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
 * 获取 Codeforces 比赛列表（通过官方 API）
 * @returns 未开始的比赛数组（仅 phase === "BEFORE"）
 */
export async function fetchCodeforcesContests(
  maxCount?: number
): Promise<CodeforcesContest[]> {
  // 请求 API
  const response = await axios.get<CfApiResponse>(
    `${API_BASE}/contest.list`,
    { timeout: 15000 }
  );

  // 检查 API 状态
  if (response.data.status !== "OK") {
    console.error("[Codeforces API] 请求失败:", response.data);
    return [];
  }

  const now = new Date();

  // 过滤并转换未开始的比赛
  const contests: CodeforcesContest[] = response.data.result
    // 仅保留未开始的比赛（phase === "BEFORE" 且 startTime 在未来，使用 UTC 比较）
    .filter((c) => {
      if (c.phase !== "BEFORE") return false;
      if (!c.startTimeSeconds) return false;
      return new Date(c.startTimeSeconds * 1000) > now;
    })
    // 转换为统一格式（startTime 转为中国标准时间 CST）
    .map((c) => ({
      name: c.name,
      startTime: new Date(c.startTimeSeconds! * 1000),
      duration: Math.round(c.durationSeconds / 60), // 秒转分钟
      url: `https://codeforces.com/contest/${c.id}`,
      platform: "Codeforces" as const,
    }));

  // 按开始时间升序排列
  contests.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 限制返回数量（默认全部）
  if (maxCount && maxCount > 0) {
    return contests.slice(0, maxCount);
  }

  return contests;
}


