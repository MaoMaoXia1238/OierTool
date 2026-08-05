/**
 * Web Push 服务端模块
 * 封装 web-push 库：VAPID 配置校验、订阅管理、消息发送与失效订阅清理。
 */

import webpush from "web-push";
import { requireEnv } from "./env";
import { prisma } from "./prisma";

/** VAPID 配置（惰性初始化：仅在发送时校验，便于测试与模块导入） */
let vapidInitialized = false;

function ensureVapidInitialized(): void {
  if (vapidInitialized) return;
  const publicKey = requireEnv(
    "VAPID_PUBLIC_KEY",
    "请配置 web/.env 中的 VAPID_PUBLIC_KEY（生成: npx web-push generate-vapid-keys --json）"
  );
  const privateKey = requireEnv(
    "VAPID_PRIVATE_KEY",
    "请配置 web/.env 中的 VAPID_PRIVATE_KEY"
  );
  const subject = requireEnv(
    "VAPID_SUBJECT",
    "请配置 web/.env 中的 VAPID_SUBJECT（如 mailto:admin@example.com）"
  );
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidInitialized = true;
}

/** 浏览器 PushSubscription 的原始数据结构 */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/** 推送通知内容 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/** 推送结果统计 */
export interface PushSendResult {
  sent: number;
  failed: number;
  /** 因订阅失效而清理的数量 */
  cleaned: number;
}

/**
 * 校验浏览器端提交的订阅数据格式
 */
export function isValidSubscription(
  sub: unknown
): sub is PushSubscriptionPayload {
  if (!sub || typeof sub !== "object") return false;
  const s = sub as Partial<PushSubscriptionPayload>;
  return (
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    !!s.keys &&
    typeof s.keys.p256dh === "string" &&
    typeof s.keys.auth === "string"
  );
}

/**
 * 保存或更新订阅（按 endpoint 去重）
 * @returns 是否为新订阅
 */
export async function upsertSubscription(
  sub: PushSubscriptionPayload
): Promise<boolean> {
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: sub.endpoint },
  });

  if (existing) {
    // 已存在但密钥变化（重新订阅）时更新
    if (
      existing.p256dh !== sub.keys.p256dh ||
      existing.auth !== sub.keys.auth
    ) {
      await prisma.pushSubscription.update({
        where: { endpoint: sub.endpoint },
        data: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      });
    }
    return false;
  }

  await prisma.pushSubscription.create({
    data: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
  return true;
}

/**
 * 按 endpoint 删除订阅（退订）
 */
export async function deleteSubscription(endpoint: string): Promise<boolean> {
  const result = await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });
  return result.count > 0;
}

/**
 * 向全部订阅发送一条通知
 * 对失效订阅（404/410）自动清理。
 */
export async function sendPushNotification(
  notification: PushNotificationPayload
): Promise<PushSendResult> {
  const subscriptions = await prisma.pushSubscription.findMany();
  const result: PushSendResult = { sent: 0, failed: 0, cleaned: 0 };

  if (subscriptions.length === 0) return result;

  ensureVapidInitialized();

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url ?? "",
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      result.sent++;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      // 404/410 表示订阅已失效，清理之
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription
          .deleteMany({ where: { endpoint: sub.endpoint } })
          .catch(() => undefined);
        result.cleaned++;
      } else {
        result.failed++;
        console.error("[Push] 发送失败:", error);
      }
    }
  }

  return result;
}
