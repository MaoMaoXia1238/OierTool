/**
 * Web Push 内部发送接口测试
 * 覆盖鉴权、比赛提醒的原子抢占、全部失败回滚与重复跳过逻辑。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique, mockUpdateMany, mockContestUpdate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockContestUpdate: vi.fn(),
}));

const { mockSendPush } = vi.hoisted(() => ({
  mockSendPush: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contest: {
      findUnique: mockFindUnique,
      updateMany: mockUpdateMany,
      update: mockContestUpdate,
    },
  },
}));

vi.mock("@/lib/push", () => ({
  sendPushNotification: mockSendPush,
}));

type RouteModule = typeof import("@/app/api/push/send/route");

async function loadRoute(): Promise<RouteModule> {
  vi.stubEnv("INTERNAL_API_SECRET", "test-secret");
  return await import("@/app/api/push/send/route");
}

function createRequest(body: unknown, secret = "test-secret"): Request {
  return new Request("http://localhost/api/push/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/push/send", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: "c1",
      name: "Round #1",
      platform: "Codeforces",
      startTime: new Date("2026-08-16T12:00:00Z"),
      url: "https://codeforces.com/1",
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockContestUpdate.mockResolvedValue({});
    mockSendPush.mockResolvedValue({ sent: 1, failed: 0, cleaned: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("缺少或错误的内部密钥返回 401", async () => {
    const route = await loadRoute();
    const response = await route.POST(createRequest({ title: "x" }, "bad"));

    expect(response.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("发送成功后保留 reminderSentAt 标记", async () => {
    const route = await loadRoute();
    const response = await route.POST(createRequest({ contestId: "c1" }));

    expect(response.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "c1", reminderSentAt: null },
      data: { reminderSentAt: expect.any(Date) },
    });
    expect(mockSendPush).toHaveBeenCalledTimes(1);
    // 成功时不应回滚标记
    expect(mockContestUpdate).not.toHaveBeenCalled();
  });

  it("全部订阅发送失败时回滚 reminderSentAt，供下一轮重试", async () => {
    mockSendPush.mockResolvedValue({ sent: 0, failed: 1, cleaned: 0 });
    const route = await loadRoute();

    const response = await route.POST(createRequest({ contestId: "c1" }));

    expect(response.status).toBe(200);
    expect(mockContestUpdate).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { reminderSentAt: null },
    });
  });

  it("比赛已被并发任务抢占时返回 already-sent", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const route = await loadRoute();

    const response = await route.POST(createRequest({ contestId: "c1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, skipped: "already-sent" });
    expect(mockSendPush).not.toHaveBeenCalled();
  });
});
