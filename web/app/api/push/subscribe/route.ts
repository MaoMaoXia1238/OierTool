/**
 * Web Push 订阅管理接口
 * POST   /api/push/subscribe —— 保存浏览器端推送订阅（按 endpoint 去重）
 * DELETE /api/push/subscribe —— 按 endpoint 删除推送订阅（退订）
 */

import { NextResponse } from "next/server";
import { isValidSubscription, upsertSubscription, deleteSubscription } from "@/lib/push";

/**
 * 处理 POST /api/push/subscribe
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
    }

    if (!isValidSubscription(body)) {
      return NextResponse.json(
        { error: "无效的订阅数据（需要 endpoint 与 keys.p256dh / keys.auth）" },
        { status: 400 }
      );
    }

    const isNew = await upsertSubscription(body);
    return NextResponse.json({ ok: true, created: isNew }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/push/subscribe 失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * 处理 DELETE /api/push/subscribe
 */
export async function DELETE(request: Request) {
  try {
    let body: { endpoint?: unknown } | null = null;
    try {
      body = await request.json();
    } catch {
      // 无请求体时走 400 分支
    }

    const endpoint = body?.endpoint;
    if (typeof endpoint !== "string" || !endpoint) {
      return NextResponse.json(
        { error: "缺少 endpoint 参数" },
        { status: 400 }
      );
    }

    const deleted = await deleteSubscription(endpoint);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("[API] DELETE /api/push/subscribe 失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
