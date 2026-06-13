/**
 * AtCoder 比赛数据获取
 * 从 AtCoder 比赛列表页 HTML 中解析比赛信息。
 *
 * 页面地址：https://atcoder.jp/contests/
 * 反爬说明：AtCoder 的 robots.txt 允许爬取 /contests/ 路径，
 * 直接使用 HTTP 请求即可获取，无需浏览器渲染。
 */

import axios from "axios";
import * as cheerio from "cheerio";

/** 解析后的比赛数据 */
export interface AtCoderContest {
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;    // 时长（分钟）
  url: string;
  platform: string;
}

/**
 * 解析持续时间文本为分钟数
 * "01:40" → 100, "02:30" → 150, "240:00" → 14400
 */
function parseDuration(text: string): number {
  const cleaned = text.trim();
  const parts = cleaned.split(":");
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return hours * 60 + minutes;
}

/**
 * 从 AtCoder 比赛列表页 HTML 中提取即将到来的比赛信息
 * @param html - 页面 HTML 文本
 * @returns 解析后的比赛数据数组
 */
export function parseAtCoderContests(html: string): AtCoderContest[] {
  const $ = cheerio.load(html);
  const now = new Date();
  const results: AtCoderContest[] = [];

  // 遍历所有表格行（Permanent / Upcoming / Daily / Recent）
  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    // 第一列：开始时间（包含完整日期字符串如 "2026-06-13 21:00:00+0900"）
    const timeAnchor = $(cells[0]).find("a");
    const timeText = timeAnchor.length
      ? timeAnchor.text().trim()
      : $(cells[0]).text().trim();
    if (!timeText) return;

    // 第二列：比赛名称和链接
    const nameCell = $(cells[1]);
    const nameLink = nameCell.find("a");
    const rawName = nameLink.text().trim();
    const href = nameLink.attr("href") || "";
    if (!rawName || !href) return;

    // 第三列：持续时间
    const durationText = $(cells[2]).text().trim();
    if (!durationText) return;

    const startTime = new Date(timeText);
    // 验证日期有效
    if (isNaN(startTime.getTime())) return;

    const duration = parseDuration(durationText);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    results.push({
      name: rawName,
      startTime,
      endTime,
      duration,
      url: `https://atcoder.jp${href}`,
      platform: "AtCoder",
    });
  });

  // 过滤：只保留开始时间在未来的比赛
  return results
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 从 AtCoder 抓取即将到来的比赛
 */
export async function fetchAtCoderContests(): Promise<AtCoderContest[]> {
  const url = "https://atcoder.jp/contests/";

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
      "Accept-Language": "ja,en;q=0.9",
    },
    timeout: 15000,
  });

  return parseAtCoderContests(html);
}
