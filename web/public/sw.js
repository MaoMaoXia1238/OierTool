/**
 * OierTool Web Push Service Worker
 * 负责接收推送消息并显示浏览器通知，点击通知跳转比赛页面。
 */
"use strict";

/** 默认跳转地址（未携带 url 时） */
const DEFAULT_URL = "/calendar";

self.addEventListener("install", () => {
  // 立即激活，不等待旧版本
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * 接收推送消息 → 显示通知
 */
self.addEventListener("push", (event) => {
  let data = { title: "OierTool 比赛提醒", body: "", url: DEFAULT_URL };

  try {
    const payload = event.data ? event.data.json() : {};
    data = { title: payload.title ?? data.title, body: payload.body ?? "", url: payload.url ?? DEFAULT_URL };
  } catch {
    // 非 JSON 载荷时使用默认文案
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.url,
      data: { url: data.url },
    })
  );
});

/**
 * 点击通知 → 聚焦或打开对应页面
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? DEFAULT_URL;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const target = new URL(url, self.location.origin).href;
      for (const client of clientList) {
        if ("focus" in client && new URL(client.url).href === target) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
