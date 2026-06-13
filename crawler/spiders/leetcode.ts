/**
 * LeetCode 比赛数据获取
 * 通过 LeetCode GraphQL API 获取竞赛信息。
 *
 * API: POST https://leetcode.com/graphql
 * 查询: { allContests { title titleSlug startTime duration containsPremium } }
 * 限制: 无需认证，建议控制请求频率
 */

import axios from "axios";

/** 解析后的比赛数据 */
export interface LeetCodeContest {
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;    // 时长（分钟）
  url: string;
  platform: string;
}

/** GraphQL API 返回的原始比赛条目 */
interface LeetCodeRawContest {
  title: string;
  titleSlug: string;
  startTime: number;   // Unix 时间戳（秒）
  duration: number;    // 秒
  containsPremium: boolean;
}

/** GraphQL API 响应结构 */
interface LeetCodeApiResponse {
  data?: {
    allContests?: LeetCodeRawContest[];
  };
}

/**
 * 从 LeetCode GraphQL API 响应中提取比赛信息
 * @param data - API 响应的 JSON 数据
 * @returns 解析后的比赛数据数组
 */
export function parseLeetCodeContests(data: LeetCodeApiResponse): LeetCodeContest[] {
  const now = new Date();
  const results: LeetCodeContest[] = [];

  const contests = data?.data?.allContests;
  if (!Array.isArray(contests)) return results;

  for (const raw of contests) {
    // 跳过需要付费的比赛（暂不爬取）
    if (raw.containsPremium) continue;

    const startTime = new Date(raw.startTime * 1000);
    const durationMinutes = Math.round(raw.duration / 60);

    results.push({
      name: raw.title,
      startTime,
      endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
      duration: durationMinutes,
      url: `https://leetcode.com/contest/${raw.titleSlug}`,
      platform: "LeetCode",
    });
  }

  // 过滤：只保留开始时间在未来的比赛，按时间升序排列
  return results
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 从 LeetCode 抓取即将到来的比赛
 */
export async function fetchLeetCodeContests(): Promise<LeetCodeContest[]> {
  const url = "https://leetcode.com/graphql";

  const { data } = await axios.post<LeetCodeApiResponse>(
    url,
    {
      operationName: null,
      variables: {},
      query: `{ allContests { title titleSlug startTime duration containsPremium } }`,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return parseLeetCodeContests(data);
}
