/**
 * 竞赛数据清洗管道单元测试
 * 覆盖输入校验、时间/时长推算、逐平台批量写入统计与非法数据过滤。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateMany } = vi.hoisted(() => ({
  mockCreateMany: vi.fn(),
}));

vi.mock("../../prisma/generated/client", () => ({
  PrismaClient: class {
    contest = {
      createMany: mockCreateMany,
      deleteMany: vi.fn(),
    };
  },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {},
}));

async function loadPipeline() {
  return await import("../../crawler/pipeline");
}

describe("computeEndTime / computeDuration", () => {
  it("有 duration 时按分钟推算结束时间", async () => {
    const { computeEndTime, computeDuration } = await loadPipeline();
    const start = new Date("2026-08-16T08:00:00Z");
    const contest = { name: "x", platform: "Codeforces", startTime: start, duration: 90, url: "u" };

    const end = computeEndTime(contest);
    expect(end.toISOString()).toBe("2026-08-16T09:30:00.000Z");
    expect(computeDuration(contest, end)).toBe(90);
  });

  it("无 duration 时根据 endTime 反推时长", async () => {
    const { computeEndTime, computeDuration } = await loadPipeline();
    const start = new Date("2026-08-16T08:00:00Z");
    const end = new Date("2026-08-16T11:00:00Z");
    const contest = { name: "x", platform: "AtCoder", startTime: start, endTime: end, url: "u" };

    expect(computeEndTime(contest)).toBe(end);
    expect(computeDuration(contest, end)).toBe(180);
  });
});

describe("isValidContestInput", () => {
  it("过滤缺少名称/平台、非法日期或非法 duration 的输入", async () => {
    const { isValidContestInput } = await loadPipeline();
    const base = {
      name: "Round #1",
      platform: "Codeforces",
      startTime: new Date("2026-08-16T08:00:00Z"),
      duration: 120,
      url: "https://example.com",
    };

    expect(isValidContestInput(base)).toBe(true);
    expect(isValidContestInput({ ...base, name: "" })).toBe(false);
    expect(isValidContestInput({ ...base, platform: " " })).toBe(false);
    expect(isValidContestInput({ ...base, startTime: new Date("bad") })).toBe(false);
    expect(isValidContestInput({ ...base, duration: -1 })).toBe(false);
  });
});

describe("runPipeline", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateMany.mockReset();
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  it("按平台分组写入并汇总 inserted/skipped", async () => {
    mockCreateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 });

    const { runPipeline } = await loadPipeline();
    const result = await runPipeline([
      {
        name: "CF A",
        platform: "Codeforces",
        startTime: new Date("2026-08-20T08:00:00Z"),
        duration: 120,
        url: "https://codeforces.com/1",
      },
      {
        name: "CF B",
        platform: "Codeforces",
        startTime: new Date("2026-08-21T08:00:00Z"),
        duration: 120,
        url: "https://codeforces.com/2",
      },
      {
        name: "CF C",
        platform: "Codeforces",
        startTime: new Date("2026-08-22T08:00:00Z"),
        duration: 120,
        url: "https://codeforces.com/3",
      },
      {
        name: "AtCoder ABC",
        platform: "AtCoder",
        startTime: new Date("2026-08-23T08:00:00Z"),
        endTime: new Date("2026-08-23T10:00:00Z"),
        url: "https://atcoder.jp/1",
      },
    ]);

    expect(mockCreateMany).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(4);
    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(1);
    expect(result.platforms.Codeforces).toEqual({ total: 3, inserted: 2, skipped: 1 });
    expect(result.platforms.AtCoder).toEqual({ total: 1, inserted: 1, skipped: 0 });
  });

  it("过滤非法记录且统计 invalid 数量", async () => {
    mockCreateMany.mockResolvedValue({ count: 1 });

    const { runPipeline } = await loadPipeline();
    const result = await runPipeline([
      {
        name: "Valid",
        platform: "Codeforces",
        startTime: new Date("2026-08-20T08:00:00Z"),
        duration: 120,
        url: "https://codeforces.com/1",
      },
      {
        name: "",
        platform: "Codeforces",
        startTime: new Date("2026-08-21T08:00:00Z"),
        duration: 120,
        url: "https://codeforces.com/2",
      },
    ]);

    expect(result.total).toBe(1);
    expect(result.invalid).toBe(1);
    expect(mockCreateMany).toHaveBeenCalledTimes(1);
  });
});
