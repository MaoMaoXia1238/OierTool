/**
 * AtCoder 爬虫解析器单元测试
 * 验证 parseAtCoderContests 函数对 AtCoder 比赛页面 HTML 的解析正确性。
 * 使用 fixture 文件（保存的 atcoder.html）模拟页面数据。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseAtCoderContests } from "../../crawler/spiders/atcoder";

// 读取 AtCoder 页面 fixture
const html = readFileSync(
  resolve(__dirname, "../fixtures/atcoder.html"),
  "utf-8"
);

describe("parseAtCoderContests", () => {
  it("应返回一个数组", () => {
    const result = parseAtCoderContests(html);
    expect(Array.isArray(result)).toBe(true);
  });

  it("应返回即将到来的比赛（所有返回的比赛 startTime > now）", () => {
    const now = new Date();
    const result = parseAtCoderContests(html);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(
        item.startTime.getTime(),
        `比赛 "${item.name}" 开始时间应在当前时间之后`
      ).toBeGreaterThan(now.getTime());
    }
  });

  it("返回的数组中每项包含所需字段且类型正确", () => {
    const result = parseAtCoderContests(html);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("startTime");
      expect(item).toHaveProperty("endTime");
      expect(item).toHaveProperty("duration");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("platform");
      expect(item.platform).toBe("AtCoder");
      expect(typeof item.name).toBe("string");
      expect(item.startTime).toBeInstanceOf(Date);
      expect(item.endTime).toBeInstanceOf(Date);
      expect(typeof item.duration).toBe("number");
      expect(item.duration).toBeGreaterThan(0);
    }
  });

  it("URL 应指向 atcoder.jp/contests/", () => {
    const result = parseAtCoderContests(html);
    for (const item of result) {
      expect(item.url).toMatch(/^https:\/\/atcoder\.jp\/contests\//);
    }
  });

  it("应正确解析比赛时长", () => {
    const result = parseAtCoderContests(html);
    // ABC 系列通常 1h40min = 100 分钟
    const abc = result.find((c) => c.name.includes("Beginner"));
    if (abc) {
      expect(abc.duration).toBe(100);
    }
    // ARC 系列通常 2h = 120 分钟
    const arc = result.find((c) => c.name.includes("Regular"));
    if (arc) {
      expect(arc.duration).toBe(120);
    }
  });

  it("空 HTML 应返回空数组", () => {
    const result = parseAtCoderContests("");
    expect(result).toEqual([]);
  });
});
