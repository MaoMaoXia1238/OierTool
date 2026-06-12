/**
 * 牛客（NowCoder）比赛数据获取
 * 从牛客竞赛页面 HTML 中解析比赛信息。
 *
 * 页面地址：https://ac.nowcoder.com/acm/contest/vip-index
 * 反爬说明：牛客 robots.txt 允许爬取 /acm/ 路径，当前无需登录。
 * 注意：页面结构可能随前端更新变化，需定期维护 HTML 解析逻辑。
 */

import axios from "axios";
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

/** 比赛卡片原始数据 */
interface RawContest {
  title: string;
  contestId: string;
  startTimeStr: string; // "2026-06-12 19:00"
  endTimeStr: string;   // "2026-06-12 22:00"
  durationText: string; // "3小时" / "2小时30分钟"
  isActive: boolean;    // 是否仍在报名/进行中
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
  // 兜底：如果啥都没匹配到（如只有数字），尝试直接解析
  if (total === 0) {
    const num = parseInt(text);
    if (!isNaN(num)) return num;
  }
  return total || 120; // 默认 2 小时
}

/**
 * 合并日期和时间为 Date 对象
 * 格式："2026-06-12 19:00" → Date
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
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

  // 所有比赛卡片：包含 "等你来战"（报名中）和 "已结束" 两类
  // 目标：选取所有包含比赛时间信息的卡片 div
  const contestCards: RawContest[] = [];

  // 遍历所有比赛卡片（每个卡片是一个带有 js-list 相关选择器的 div）
  // 通过观察页面结构：比赛卡片在 .platform-item 或类似容器中
  // 使用更通用的选择器：查找包含比赛标题链接的容器
  $("a[href^='/acm/contest/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    // 只处理形如 /acm/contest/136706 的链接（比赛详情页）
    const match = href.match(/^\/acm\/contest\/(\d+)$/);
    if (!match) return;

    const contestId = match[1];
    const title = $(el).text().trim();
    if (!title) return;

    // 找到包含此链接的最近父卡片
    const card = $(el).closest("div").parents().filter((_, p) => {
      return $(p).find(".platform-item-main")
        .length > 0 || $(p).find(".contest-name")
        .length > 0 || $(p).find("div[class*='platform']")
        .length > 0;
    }).first();

    // 尝试多种方式定位卡片容器
    let $card = $(el).closest(".platform-item, .js-list, [class*='contest'], [class*='platform']");
    if ($card.length === 0) {
      // 兜底：向上找包含时间文本的最近父容器
      $card = $(el).parents().filter((_, p) => {
        const text = $(p).text() || "";
        return text.includes("报名时间") || text.includes("比赛时间");
      }).first();
    }
    if ($card.length === 0) $card = $(el).parent().parent();

    const cardHtml = $card.length ? $card.html() || "" : "";
    const cardText = $card.length ? $card.text() : "";

    // 提取报名时间或比赛时间
    const timeMatch = cardText.match(/比赛时间[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*至\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
    if (!timeMatch) return;

    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];

    // 判断是否活跃（"报名中" 或 "正在报名" 等标签）
    const isActive = cardText.includes("报名中") || cardText.includes("报名");

    // 提取时长（可能出现在比赛时间之后）
    const durationMatch = cardText.match(/时长[：:]\s*(\S+?)(?:\s|$)/);
    const durationText = durationMatch ? durationMatch[1] : "";

    results.push({
      name: title,
      startTime: new Date(startTimeStr.replace(" ", "T") + "+08:00"),
      endTime: new Date(endTimeStr.replace(" ", "T") + "+08:00"),
      duration: durationText ? parseDuration(durationText) : 0,
      url: `https://ac.nowcoder.com${href}`,
      platform: "NowCoder",
    });
  });

  // 如果上面的方法没有找到数据，尝试备选方案：直接从可见文本中提取
  if (results.length === 0) {
    // 备用方案：匹配 "等你来战" 区域下的比赛条目
    const upcomingSection = $("body").text();
    const sectionMatch = upcomingSection.match(/等你来战[\s\S]*?(?=已结束|$)/);
    if (sectionMatch) {
      const sectionText = sectionMatch[0];
      // 尝试按块提取
      const blocks = sectionText.split(/(?=####)/);
      for (const block of blocks) {
        const linkMatch = block.match(/https:\/\/ac\.nowcoder\.com\/acm\/contest\/(\d+)/);
        const titleMatch = block.match(/####\s*(.+)/);
        const timeMatch = block.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*至\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
        if (linkMatch && timeMatch) {
          const title = titleMatch ? titleMatch[1].trim() : (`NowCoder Contest ${linkMatch[1]}`);
          results.push({
            name: title,
            startTime: new Date(timeMatch[1].replace(" ", "T") + "+08:00"),
            endTime: new Date(timeMatch[2].replace(" ", "T") + "+08:00"),
            duration: 120,
            url: `https://ac.nowcoder.com/acm/contest/${linkMatch[1]}`,
            platform: "NowCoder",
          });
        }
      }
    }
  }

  // 过滤：只保留开始时间在未来的比赛
  return results
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * 从牛客抓取即将到来的比赛
 */
export async function fetchNowCoderContests(): Promise<NowCoderContest[]> {
  const url = "https://ac.nowcoder.com/acm/contest/vip-index";

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    timeout: 15000,
  });

  return parseNowCoderContests(html);
}
