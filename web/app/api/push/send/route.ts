/**
 * Web Push 内部发送接口（仅供爬虫调用）
 * POST /api/push/send —— 向全部订阅发送比赛提醒通知。
 * 鉴权：请求头 x-internal-secret 必须与 INTERNAL_API_SECRET 一致。
 * 可选参数 body.contestId：指定比赛时查询该比赛并生成提醒文案；
 * 或直接传 title/body/url 自定义通知内容。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEnv } from "@/lib/env";
import { sendPushNotification } from "@/lib/push";
import { formatStartTime } from "@/lib/utils";

const INTERNAL_SECRET = requireEnv(
  "INTERNAL_API_SECRET",
  "请配置 web/.env 中的 INTERNAL_API_SECRET"
);

/** 提醒窗口说明：爬虫在比赛开始前 15 分钟触发提醒（与 crawler 的 REMINDER_WINDOW_MINUTES 一致） */
export const REMINDER_WINDOW_MINUTES = 15;

/** 发送接口请求体 */
interface SendRequestBody {
  /** 指定比赛 id（推荐）：服务端查询比赛并生成提醒文案 */
  contestId?: string;
  /** 自定义通知内容（与 contestId 二选一） */
  title?: string;
  body?: string;
  url?: string;
}

/**
 * 校验内部调用鉴权
 */
function isAuthorized(request: Request): boolean {
  const secret = request.headers.get("x-internal-secret");
  return secret === INTERNAL_SECRET;
}

/**
 * 处理 POST /api/push/send
 */
export async function POST(request: Request) {
  // 内部鉴权
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as SendRequestBody | null;
    if (!body) {
      return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
    }

    // 按 contestId 生成提醒内容
    if (body.contestId) {
      const contest = await prisma.contest.findUnique({
        where: { id: body.contestId },
      });
      if (!contest) {
        return NextResponse.json({ error: "比赛不存在" }, { status: 404 });
      }
      if (contest.reminderSentAt) {
        return NextResponse.json({ ok: true, skipped: "already-sent" });
      }

      // 先标记已提醒（避免并发重复），再发送
      await prisma.contest.update({
        where: { id: contest.id },
        data: { reminderSentAt: new Date() },
      });

      const result = await sendPushNotification({
        title: `${contest.platform} · ${contest.name}`,
        body: `比赛将于 ${formatStartTime(contest.startTime)} 开始，抓紧准备！`,
        url: contest.url ?? undefined,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    // 自定义通知内容
    if (!body.title) {
      return NextResponse.json(
        { error: "需要提供 contestId 或 title" },
        { status: 400 }
      );
    }

    const result = await sendPushNotification({
      title: body.title,
      body: body.body ?? "",
      url: body.url,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[API] POST /api/push/send 失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
