/**
 * 牛客（NowCoder）比赛数据获取（Playwright 方案）
 * 使用 Playwright 无头浏览器渲染牛客比赛列表页面，
 * 从 HTML 中解析比赛信息。
 *
 * 页面地址：https://ac.nowcoder.com/acm/contest/vip-index
 * 反爬说明：牛客使用阿里云 WAF 拦截直接 HTTP 请求，
 * 使用真实浏览器渲染可绕过此限制。
 */

import { chromium } from "playwright";
import * as cheerio from "cheerio";

/** 解析后的比赛数据 */
export interface NowCoderContest {
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;    // 时长（分钟）
  url: string;
  platform: string;
}

/**
 * 解析持续时间文本为分钟数
 * "3小时" → 180, "2小时30分钟" → 150, "1小时" → 60
 */
function parseDuration(text: string): number {
  let total = 0;
  const hourMatch = text.match(/(\d+)小时/);
  const minMatch = text.match(/(\d+)分(?:钟)?/);
  if (hourMatch) total += parseInt(hourMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total || 120; // 默认 2 小时
}

/**
 * 从牛客比赛列表页 HTML 中提取比赛信息
 * @param html - 页面 HTML 文本
 * @returns 解析后的比赛数据数组
 */
export function parseNowCoderContests(html: string): NowCoderContest[] {
  const $ = cheerio.load(html);
  const now = new Date();
  const results: NowCoderContest[] = [];

  // 遍历所有包含比赛标题链接的元素
  $("a[href^='/acm/contest/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    // 只处理形如 /acm/contest/136706 的链接（比赛详情页）
    const match = href.match(/^\/acm\/contest\/(\d+)$/);
    if (!match) return;

    const contestId = match[1];
    const title = $(el).text().trim();
    if (!title) return;

    // 向上查找包含此链接的最近父卡片
    const $card = $(el).parents().filter((_, p) => {
      const text = $(p).text() || "";
      return text.includes("报名时间") || text.includes("比赛时间");
    }).first();
    if ($card.length === 0) return;

    const cardText = $card.text();

    // 提取比赛时间
    const timeMatch = cardText.match(/比赛时间[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*至\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
    if (!timeMatch) return;

    const startDateStr = timeMatch[1];
    const endDateStr = timeMatch[2];

    // 提取时长（可能出现在比赛时间之后）
    const durationMatch = cardText.match(/时长[：:]\s*(\S+?)(?:\s|$)/);
    const durationText = durationMatch ? durationMatch[1] : "";

    results.push({
      name: title,
      startTime: new Date(startDateStr.replace(" ", "T") + "+08:00"),
      endTime: new Date(endDateStr.replace(" ", "T") + "+08:00"),
      duration: durationText ? parseDuration(durationText) : 120,
      url: `https://ac.nowcoder.com${href}`,
      platform: "NowCoder",
    });
  });

  // 过滤：只保留开始时间在未来的比赛，按时间升序排列
  return results
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 从牛客抓取即将到来的比赛
 * 使用 Playwright 无头浏览器绕过 WAF 拦截
 */
export async function fetchNowCoderContests(): Promise<NowCoderContest[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto("https://ac.nowcoder.com/acm/contest/vip-index", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 等待页面内容加载完成（等待比赛列表出现）
    await page.waitForSelector("a[href^='/acm/contest/']", { timeout: 15000 });

    const html = await page.content();
    return parseNowCoderContests(html);
  } finally {
    await browser.close();
  }
}
