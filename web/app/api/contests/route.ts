/**
 * 竞赛数据 API 路由处理器
 * GET /api/contests —— 返回即将到来的竞赛列表。
 * 支持参数：platform（平台筛选）、limit（数量上限，1-500，默认 100）。
 * 仅返回 startTime > 当前时间的竞赛，按 startTime 升序排列。
 * 响应带 CDN 缓存头（5 分钟 + stale-while-revalidate）。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLATFORM_LOGOS } from "@/lib/platforms";
import { toContestData } from "@/lib/contest";

/** 支持的平台白名单（与平台 Logo 映射保持一致） */
const ALLOWED_PLATFORMS = new Set(Object.keys(PLATFORM_LOGOS));

/** 默认 / 最大返回数量 */
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/** CDN / 浏览器缓存策略：5 分钟 + 1 小时 stale 兜底 */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

/**
 * 处理 GET /api/contests 请求
 * @param request - 标准 Web Request 对象
 * @returns JSON 响应，包含竞赛数组或错误信息
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // 校验 platform 参数（白名单，拒绝未知平台）
    const platform = url.searchParams.get("platform");
    if (platform && !ALLOWED_PLATFORMS.has(platform)) {
      return NextResponse.json(
        { error: `不支持的平台: ${platform}` },
        { status: 400 }
      );
    }

    // 校验 limit 参数（正整数，1-500）
    const limitRaw = url.searchParams.get("limit");
    let limit = DEFAULT_LIMIT;
    if (limitRaw) {
      const parsed = Number(limitRaw);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
        return NextResponse.json(
          { error: `limit 必须是 1-${MAX_LIMIT} 之间的整数` },
          { status: 400 }
        );
      }
      limit = parsed;
    }

    // 查询数据库：仅未开始的比赛，按开始时间升序
    const contests = await prisma.contest.findMany({
      where: {
        startTime: { gt: new Date() },
        ...(platform ? { platform } : {}),
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });

    // 转换为 DTO 后返回（规范化 url 等字段）
    return NextResponse.json(contests.map(toContestData), {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    // 记录服务端错误（不向客户端泄露内部信息）
    console.error("[API] GET /api/contests 查询失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
