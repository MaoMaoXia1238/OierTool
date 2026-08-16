/**
 * Web Push 提醒开关组件
 * 管理浏览器推送订阅：开启（注册 Service Worker + 请求权限 + 保存订阅）与关闭。
 * 需要 HTTPS 或本机 localhost 环境。
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

/** 组件状态 */
type PushState = "unsupported" | "idle" | "busy" | "subscribed";

/** VAPID 公钥（NEXT_PUBLIC_ 前缀，构建时注入客户端） */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * base64url 字符串 → Uint8Array（pushManager.subscribe 需要）
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64url);
  const result = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    result[i] = rawData.charCodeAt(i);
  }
  return result;
}

export function PushSubscribeButton() {
  // 初始状态在服务端与客户端保持一致（"idle"），能力检测在挂载后异步执行
  const [state, setState] = useState<PushState>("idle");

  // 初始化：检测浏览器能力与已有订阅（异步回调中更新状态，避免 hydration 不一致）
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supported =
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          Boolean(VAPID_PUBLIC_KEY);
        if (cancelled) return;
        if (!supported) {
          setState("unsupported");
          return;
        }
        // 使用 getRegistration 而不是 serviceWorker.ready：
        // 尚未注册过 SW 时 ready 会一直等待，导致按钮长期停留在初始状态。
        const registration = await navigator.serviceWorker.getRegistration();
        const sub = registration
          ? await registration.pushManager.getSubscription()
          : null;
        if (!cancelled) setState(sub ? "subscribed" : "idle");
      } catch {
        if (!cancelled) setState("idle");
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * 开启推送提醒
   */
  const enablePush = useCallback(async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("idle");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 保存订阅到服务端
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error(`订阅保存失败: HTTP ${res.status}`);

      setState("subscribed");
    } catch (error) {
      console.error("开启推送提醒失败:", error);
      setState("idle");
    }
  }, []);

  /**
   * 关闭推送提醒
   */
  const disablePush = useCallback(async () => {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setState("idle");
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // 通知服务端删除
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error("关闭推送提醒失败:", error);
    } finally {
      setState("idle");
    }
  }, []);

  // 浏览器不支持
  if (state === "unsupported") {
    return (
      <button
        type="button"
        disabled
        title="当前浏览器不支持推送通知（需 HTTPS 或 localhost）"
        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50"
      >
        <BellOff className="h-4 w-4" />
        提醒不可用
      </button>
    );
  }

  // 已订阅
  if (state === "subscribed") {
    return (
      <button
        type="button"
        onClick={disablePush}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:border-destructive/40 hover:text-destructive dark:text-emerald-400"
      >
        <BellRing className="h-4 w-4" />
        已开启提醒
      </button>
    );
  }

  // 未订阅 / 操作中
  return (
    <button
      type="button"
      onClick={enablePush}
      disabled={state === "busy"}
      title="比赛开始前 15 分钟在浏览器中收到通知提醒"
      className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
    >
      {state === "busy" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      开启提醒
    </button>
  );
}
