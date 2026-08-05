/**
 * Web Push 模块单元测试
 * 覆盖订阅格式校验与失效订阅判定逻辑（不依赖真实推送服务）。
 * @/lib/prisma 会被 mock，避免模块导入时校验 DATABASE_URL。
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pushSubscription: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { isValidSubscription } from "@/lib/push";

describe("isValidSubscription", () => {
  const valid = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: {
      p256dh: "BBb3RzV8N8cKfZQf5k0Qv7m1y9o=",
      auth: "8aDm3LxQ7s=",
    },
  };

  it("合法订阅应通过校验", () => {
    expect(isValidSubscription(valid)).toBe(true);
  });

  it("endpoint 非 https 应拒绝", () => {
    expect(
      isValidSubscription({ ...valid, endpoint: "http://insecure.example.com" })
    ).toBe(false);
  });

  it("缺少 keys 应拒绝", () => {
    const { keys, ...rest } = valid;
    expect(isValidSubscription(rest)).toBe(false);
  });

  it("keys 字段类型错误应拒绝", () => {
    expect(
      isValidSubscription({ ...valid, keys: { p256dh: 123, auth: "x" } })
    ).toBe(false);
  });

  it("非对象输入应拒绝", () => {
    expect(isValidSubscription(null)).toBe(false);
    expect(isValidSubscription("string")).toBe(false);
    expect(isValidSubscription(undefined)).toBe(false);
  });
});
