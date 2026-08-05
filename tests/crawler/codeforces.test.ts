/**
 * Codeforces 爬虫单元测试
 * 直接测试 spider 中导出的纯转换函数 transformContests，
 * 覆盖过滤、排序、格式转换等核心逻辑。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transformContests, type CfApiContest } from "../../crawler/spiders/codeforces";

beforeEach(() => {
  // 固定系统时间，避免 mock 数据中的静态时间戳随真实时间推移过期
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-04-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// API 原始响应样例
const mockApiData: CfApiContest[] = [
  {
    id: 2237,
    name: "Order Capital Round 2 (Codeforces Round, Div. 1 + Div. 2)",
    phase: "BEFORE",
    durationSeconds: 10800,
    startTimeSeconds: 1790000000, // ~2026-09-21
  },
  {
    id: 2236,
    name: "Codeforces Round 1103 (Div. 3)",
    phase: "BEFORE",
    durationSeconds: 9000,
    startTimeSeconds: 1785000000, // ~2026-07-25 → 早于上面那场
  },
  {
    id: 2233,
    name: "Educational Codeforces Round 191 (Rated for Div. 2)",
    phase: "FINISHED",
    durationSeconds: 7200,
    startTimeSeconds: 1781015700,
  },
];

describe("transformContests", () => {
  it("应返回未开始的比赛数组", () => {
    const result = transformContests(mockApiData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("startTime");
      expect(item).toHaveProperty("duration");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("platform");
      expect(item.platform).toBe("Codeforces");
    }
  });

  it("应过滤已结束的比赛", () => {
    const result = transformContests(mockApiData);

    const finishedNames = result.map((c) => c.name);
    expect(finishedNames).not.toContain(
      "Educational Codeforces Round 191 (Rated for Div. 2)"
    );
  });

  it("应正确转换数据：名称、链接、时长", () => {
    const result = transformContests(mockApiData);

    // 按开始时间升序，第一场是最早的比赛
    expect(result[0].name).toBe("Codeforces Round 1103 (Div. 3)");
    expect(result[0].url).toBe("https://codeforces.com/contest/2236");
    expect(result[0].duration).toBe(150); // 9000s / 60
    expect(result[0].startTime).toBeInstanceOf(Date);
  });

  it("API 返回空数组时应返回空结果", () => {
    const result = transformContests([]);
    expect(result).toEqual([]);
  });

  it("全部比赛已结束时应返回空结果", () => {
    const allFinished: CfApiContest[] = [
      { id: 1, name: "Old Contest", phase: "FINISHED", durationSeconds: 7200, startTimeSeconds: 1000000000 },
    ];
    const result = transformContests(allFinished);
    expect(result).toEqual([]);
  });

  it("缺少 startTimeSeconds 的 BEFORE 比赛应被过滤", () => {
    const noStart: CfApiContest[] = [
      { id: 2, name: "No Start Time", phase: "BEFORE", durationSeconds: 7200 },
    ];
    const result = transformContests(noStart);
    expect(result).toEqual([]);
  });
});
