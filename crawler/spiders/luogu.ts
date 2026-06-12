/**
 * 洛谷比赛数据获取（Playwright 方案）
 * 使用 Playwright 无头浏览器渲染洛谷比赛列表页面，
 * 从 <script id="lentille-context"> 中提取 SSR 注入的 JSON 数据。
 * 相比 cheerio 解析 noscript HTML，可获取全部比赛而非仅当前页。
 *
 * 反爬说明：洛谷对直接 HTTP 请求返回 302 重定向，
 * 使用真实浏览器渲染可绕过此限制。
 */
import { chromium } from "playwright";

/** 解析后的比赛数据 */
export interface LuoguContest {
  name: string;
  startTime: Date;
  endTime: Date;
  url: string;
  platform: string;
}

/** lentille-context JSON 中的比赛条目 */
interface LuoguContestRaw {
  id: number;
  name: string;
  startTime: number;   // Unix 时间戳（秒）
  endTime: number;      // Unix 时间戳（秒）
}

/**
 * 从洛谷 HTML 页面中提取并解析比赛数据
 * 从 <script id="lentille-context"> 提取 JSON，过滤未开始比赛并格式化为 LuoguContest。
 * @param html - 洛谷比赛列表页的完整 HTML
 * @returns 未开始的比赛数组
 */
export function parseLuoguFromHtml(html: string): LuoguContest[] {
  // 提取 <script id="lentille-context"> 中的 JSON
  const match = html.match(/<script\s+id="lentille-context"[^>]*>([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    return [];
  }

  const data = JSON.parse(match[1]);
  const contests: LuoguContestRaw[] = data?.data?.contests?.result ?? [];
  const now = new Date();

  return contests
    .filter((c) => new Date(c.startTime * 1000) > now)
    .map((c) => ({
      name: c.name,
      startTime: new Date(c.startTime * 1000),
      endTime: new Date(c.endTime * 1000),
      url: `https://www.luogu.com.cn/contest/${c.id}`,
      platform: "Luogu" as const,
    }))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 获取洛谷比赛列表（通过 Playwright 渲染页面）
 * @returns 未开始的比赛数组（仅 startTime > 当前时间）
 */
export async function fetchLuoguContests(): Promise<LuoguContest[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    // 设置中文 Accept-Language，避免页面返回英文内容
    await page.setExtraHTTPHeaders({
      "Accept-Language": "zh-CN,zh;q=0.9",
    });

    console.log("[洛谷] 正在渲染比赛列表页面...");
    // 等待页面加载完成（networkidle 确保 JS 渲染完毕）
    await page.goto("https://www.luogu.com.cn/contest/list", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 获取页面 HTML，交给解析函数处理
    const html = await page.content();
    const contests = parseLuoguFromHtml(html);

    if (contests.length === 0) {
      console.warn("[洛谷] 未找到未开始的比赛");
    }
    return contests;
  } finally {
    await browser.close();
  }
}
