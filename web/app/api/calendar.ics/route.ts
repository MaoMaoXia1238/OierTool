/**
 * iCal 日历订阅接口
 * GET /api/calendar.ics —— 生成即将到来的竞赛日历（RFC 5545），
 * 用户可将此 URL 订阅到 Google Calendar / Outlook / 苹果日历等应用。
 * 支持 ?platform= 单平台订阅（如 /api/calendar.ics?platform=Codeforces）。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLATFORM_LOGOS } from "@/lib/platforms";
import { buildIcsCalendar } from "@/lib/ics";

/** 支持的平台白名单 */
const ALLOWED_PLATFORMS = new Set(Object.keys(PLATFORM_LOGOS));

/** CDN 缓存策略：5 分钟 + 1 小时 stale 兜底 */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "Content-Type": "text/calendar; charset=utf-8",
  "Content-Disposition": 'attachment; filename="oiertool-calendar.ics"',
};

/**
 * 处理 GET /api/calendar.ics 请求
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // 校验 platform 参数（白名单）
    const platform = url.searchParams.get("platform");
    if (platform && !ALLOWED_PLATFORMS.has(platform)) {
      return NextResponse.json(
        { error: `不支持的平台: ${platform}` },
        { status: 400 }
      );
    }

    const rows = await prisma.contest.findMany({
      where: {
        startTime: { gt: new Date() },
        ...(platform ? { platform } : {}),
      },
      orderBy: { startTime: "asc" },
      take: 200, // 订阅日历一般展示未来 1-3 个月比赛，200 场足够
      select: {
        id: true,
        name: true,
        platform: true,
        startTime: true,
        endTime: true,
        duration: true,
        url: true,
      },
    });

    const ics = buildIcsCalendar(
      rows.map((c) => ({ ...c, url: c.url ?? "" })),
      {
        calendarName: platform ? `OierTool ${platform}` : "OierTool 竞赛日历",
      }
    );

    return new NextResponse(ics, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[API] GET /api/calendar.ics 生成失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
