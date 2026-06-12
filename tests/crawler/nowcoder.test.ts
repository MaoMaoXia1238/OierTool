/**
 * 牛客爬虫解析器单元测试
 * 验证 parseNowCoderContests 函数对牛客比赛页面 HTML 的解析正确性。
 * 使用 fixture 文件（保存的 nowcoder.html）模拟页面数据。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseNowCoderContests } from "../../crawler/spiders/nowcoder";

// 读取牛客页面 fixture
const html = readFileSync(
  resolve(__dirname, "../fixtures/nowcoder.html"),
  "utf-8"
);

describe("parseNowCoderContests", () => {
  it("应返回一个数组", () => {
    const result = parseNowCoderContests(html);
    expect(Array.isArray(result)).toBe(true);
  });

  it("返回的数组中每项包含所需字段", () => {
    const result = parseNowCoderContests(html);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("startTime");
      expect(item).toHaveProperty("endTime");
      expect(item).toHaveProperty("duration");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("platform");
      expect(item.platform).toBe("NowCoder");
      // 验证字段类型
      expect(typeof item.name).toBe("string");
      expect(item.startTime).toBeInstanceOf(Date);
      expect(item.endTime).toBeInstanceOf(Date);
      expect(typeof item.duration).toBe("number");
      expect(typeof item.url).toBe("string");
      expect(typeof item.platform).toBe("string");
      // duration 应为正数
      expect(item.duration).toBeGreaterThan(0);
    }
  });

  it("应返回牛客平台的比赛，URL 指向 ac.nowcoder.com", () => {
    const result = parseNowCoderContests(html);
    for (const item of result) {
      expect(item.url).toMatch(/^https:\/\/ac\.nowcoder\.com\/acm\/contest\//);
    }
  });

  it("应过滤已结束的比赛（所有返回的比赛 startTime > now）", () => {
    const now = new Date();
    const result = parseNowCoderContests(html);
    for (const item of result) {
      expect(
        item.startTime.getTime(),
        `比赛 "${item.name}" 开始时间 ${item.startTime.toISOString()} 应在当前时间 ${now.toISOString()} 之后`
      ).toBeGreaterThan(now.getTime());
    }
  });

  it("空 HTML 应返回空数组", () => {
    const result = parseNowCoderContests("");
    expect(result).toEqual([]);
  });
});
