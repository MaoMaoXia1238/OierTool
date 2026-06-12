/**
 * 洛谷爬虫解析器单元测试
 * 验证 parseLuoguFromHtml 函数对洛谷比赛页面 HTML 的解析正确性。
 * 使用 fixture 文件（包含 lentille-context JSON）模拟完整页面。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseLuoguFromHtml } from "../../crawler/spiders/luogu";

// 读取洛谷页面 fixture
const html = readFileSync(
  resolve(__dirname, "../fixtures/luogu.html"),
  "utf-8"
);

describe("parseLuoguFromHtml", () => {
  it("应返回一个数组", () => {
    const result = parseLuoguFromHtml(html);
    expect(Array.isArray(result)).toBe(true);
  });

  it("返回的数组中每项包含所需字段", () => {
    const result = parseLuoguFromHtml(html);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("startTime");
      expect(item).toHaveProperty("endTime");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("platform");
      expect(item.platform).toBe("Luogu");
      // 验证字段类型
      expect(typeof item.name).toBe("string");
      expect(item.startTime).toBeInstanceOf(Date);
      expect(item.endTime).toBeInstanceOf(Date);
      expect(typeof item.url).toBe("string");
      expect(typeof item.platform).toBe("string");
    }
  });

  it("应过滤已结束的比赛（所有返回的比赛 startTime > now）", () => {
    const now = new Date();
    const result = parseLuoguFromHtml(html);
    for (const item of result) {
      expect(
        item.startTime.getTime(),
        `比赛 "${item.name}" 开始时间 ${item.startTime.toISOString()} 应在当前时间 ${now.toISOString()} 之后`
      ).toBeGreaterThan(now.getTime());
    }
  });
});
