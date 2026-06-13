/**
 * LeetCode 爬虫解析器单元测试
 * 验证 parseLeetCodeContests 函数对 GraphQL API 响应的解析正确性。
 * 使用 fixture 文件（保存的 leetcode.json）模拟 API 响应数据。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseLeetCodeContests } from "../../crawler/spiders/leetcode";

// 读取 LeetCode API 响应 fixture
const raw = readFileSync(
  resolve(__dirname, "../fixtures/leetcode.json"),
  "utf-8"
);
const data = JSON.parse(raw);

describe("parseLeetCodeContests", () => {
  it("应返回一个数组", () => {
    const result = parseLeetCodeContests(data);
    expect(Array.isArray(result)).toBe(true);
  });

  it("应返回即将到来的比赛（所有返回的比赛 startTime > now）", () => {
    const now = new Date();
    const result = parseLeetCodeContests(data);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(
        item.startTime.getTime(),
        `比赛 "${item.name}" 开始时间应在当前时间之后`
      ).toBeGreaterThan(now.getTime());
    }
  });

  it("返回的数组中每项包含所需字段且类型正确", () => {
    const result = parseLeetCodeContests(data);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("startTime");
      expect(item).toHaveProperty("endTime");
      expect(item).toHaveProperty("duration");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("platform");
      expect(item.platform).toBe("LeetCode");
      expect(typeof item.name).toBe("string");
      expect(item.startTime).toBeInstanceOf(Date);
      expect(item.endTime).toBeInstanceOf(Date);
      expect(typeof item.duration).toBe("number");
      expect(item.duration).toBeGreaterThan(0);
    }
  });

  it("URL 应指向 leetcode.com/contest/", () => {
    const result = parseLeetCodeContests(data);
    for (const item of result) {
      expect(item.url).toMatch(/^https:\/\/leetcode\.com\/contest\//);
    }
  });

  it("应正确解析比赛时长（标准周赛 90 分钟 = 5400 秒）", () => {
    const result = parseLeetCodeContests(data);
    const weekly = result.find((c) => c.name.includes("Weekly"));
    if (weekly) {
      expect(weekly.duration).toBe(90);
    }
  });

  it("空数据应返回空数组", () => {
    const result1 = parseLeetCodeContests({});
    expect(result1).toEqual([]);

    const result2 = parseLeetCodeContests({ data: { allContests: [] } });
    expect(result2).toEqual([]);
  });
});
