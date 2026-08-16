/**
 * 竞赛数据 API 集成测试
 * 测试 GET /api/contests 接口的各类场景。
 * 使用 vitest mock Prisma Client 避免依赖真实数据库。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// 使用 vi.hoisted 提升 mock 函数声明，避免 vi.mock 工厂中引用未初始化变量
const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

// 在导入路由处理器之前 mock @/lib/prisma，确保被测代码使用的是 mock
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contest: {
      findMany: mockFindMany,
    },
  },
}));

// 在 mock 建立之后动态导入 GET 路由处理器
import { GET } from "@/app/api/contests/route";

describe("GET /api/contests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  /** 辅助函数：构造一个带可选查询参数的 Request 对象 */
  function createRequest(searchParams?: string): Request {
    const url =
      "http://localhost/api/contests" + (searchParams ? `?${searchParams}` : "");
    return new Request(url);
  }

  it("返回竞赛列表，HTTP 200，数据为数组", async () => {
    const mockContests = [
      {
        id: "1",
        name: "Codeforces Round #1000",
        platform: "Codeforces",
        startTime: new Date("2026-07-01"),
        endTime: new Date("2026-07-01T02:00:00"),
        duration: 120,
        url: "https://codeforces.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "洛谷月赛",
        platform: "Luogu",
        startTime: new Date("2026-07-15"),
        endTime: new Date("2026-07-15T03:00:00"),
        duration: 180,
        url: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockFindMany.mockResolvedValue(mockContests);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Codeforces Round #1000");
    expect(data[1].name).toBe("洛谷月赛");
  });

  it("按 platform 参数筛选（?platform=Codeforces）", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "1",
        name: "Codeforces Round #1000",
        platform: "Codeforces",
        startTime: new Date("2026-07-01"),
        endTime: new Date("2026-07-01T02:00:00"),
        duration: 120,
        url: "https://codeforces.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await GET(createRequest("platform=Codeforces"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].platform).toBe("Codeforces");

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.platform).toBe("Codeforces");
    expect(callArgs.where.startTime.gt).toBeInstanceOf(Date);
    expect(callArgs.orderBy).toEqual({ startTime: "asc" });
  });

  it("默认状态查询未开始的比赛（startTime > now）", async () => {
    await GET(createRequest());

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.startTime).toEqual({ gt: expect.any(Date) });
    expect(callArgs.where.endTime).toBeUndefined();
    expect(callArgs.orderBy).toEqual({ startTime: "asc" });
  });

  it("status=ongoing 查询进行中的比赛（startTime <= now < endTime）", async () => {
    await GET(createRequest("status=ongoing"));

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.startTime).toEqual({ lte: expect.any(Date) });
    expect(callArgs.where.endTime).toEqual({ gt: expect.any(Date) });
    expect(callArgs.orderBy).toEqual({ startTime: "asc" });
  });

  it("status=finished 查询已结束的比赛（endTime <= now）", async () => {
    await GET(createRequest("status=finished"));

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.endTime).toEqual({ lte: expect.any(Date) });
    expect(callArgs.where.startTime).toBeUndefined();
    expect(callArgs.orderBy).toEqual({ startTime: "desc" });
  });

  it("非法 status 返回 HTTP 400 并提示可选值", async () => {
    const response = await GET(createRequest("status=unknown"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("ongoing"),
    });
  });

  it("数据库查询出错时返回 HTTP 500", async () => {
    mockFindMany.mockRejectedValue(new Error("数据库连接失败"));

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
  });
});
