/**
 * 竞赛数据 API 集成测试
 * 测试 GET /api/contests 接口的各类场景。
 * 使用 vitest mock Prisma Client 避免依赖真实数据库。
 * TDD 红灯阶段：测试先于实现编写，当前应全部失败。
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
    // 每个测试前重置 mock 状态，避免测试间相互影响
    vi.clearAllMocks();
  });

  /** 辅助函数：构造一个带可选查询参数的 Request 对象 */
  function createRequest(searchParams?: string): Request {
    const url = "http://localhost/api/contests" + (searchParams ? `?${searchParams}` : "");
    return new Request(url);
  }

  it("返回竞赛列表，HTTP 200，数据为数组", async () => {
    // 准备 mock 数据——模拟数据库中即将到来的竞赛记录
    const mockContests = [
      { id: "1", name: "Codeforces Round #1000", platform: "Codeforces", startTime: new Date("2026-07-01"), endTime: new Date("2026-07-01T02:00:00"), duration: 120, url: "https://codeforces.com", createdAt: new Date(), updatedAt: new Date() },
      { id: "2", name: "洛谷月赛", platform: "Luogu", startTime: new Date("2026-07-15"), endTime: new Date("2026-07-15T03:00:00"), duration: 180, url: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockFindMany.mockResolvedValue(mockContests);

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    // 验证 HTTP 状态码和数据格式
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Codeforces Round #1000");
    expect(data[1].name).toBe("洛谷月赛");
  });

  it("按 platform 参数筛选（?platform=Codeforces）", async () => {
    const mockContests = [
      { id: "1", name: "Codeforces Round #1000", platform: "Codeforces", startTime: new Date("2026-07-01"), endTime: new Date("2026-07-01T02:00:00"), duration: 120, url: "https://codeforces.com", createdAt: new Date(), updatedAt: new Date() },
    ];
    mockFindMany.mockResolvedValue(mockContests);

    const request = createRequest("platform=Codeforces");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].platform).toBe("Codeforces");

    // 验证 findMany 调用时传递了正确的筛选参数
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    // platform 筛选条件应正确传递
    expect(callArgs.where.platform).toBe("Codeforces");
    // startTime > now 的条件也应存在
    expect(callArgs.where.startTime.gt).toBeInstanceOf(Date);
    // 按 startTime 升序排列
    expect(callArgs.orderBy).toEqual({ startTime: "asc" });
  });

  it("数据库无即将到来的比赛时返回空数组，HTTP 200", async () => {
    // mock 返回空数组
    mockFindMany.mockResolvedValue([]);

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("数据库查询出错时返回 HTTP 500", async () => {
    // mock 抛出错误模拟数据库连接失败
    mockFindMany.mockRejectedValue(new Error("数据库连接失败"));

    const request = createRequest();
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
