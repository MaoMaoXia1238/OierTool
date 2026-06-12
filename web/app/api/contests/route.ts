/**
 * 竞赛数据 API 路由处理器
 * GET /api/contests —— 返回即将到来的竞赛列表，支持按平台筛选。
 * 仅返回 startTime > 当前时间的竞赛，按 startTime 升序排列。
 * 支持的可选查询参数：platform（Codeforces / Luogu）。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 处理 GET /api/contests 请求
 * @param request - 标准 Web Request 对象
 * @returns JSON 响应，包含竞赛数组或错误信息
 */
export async function GET(request: Request) {
  try {
    // 解析查询参数
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");

    // 构建 Prisma 查询条件：仅返回未开始的竞赛
    const where: Record<string, unknown> = {
      startTime: { gt: new Date() },
    };

    // 可选：按平台筛选
    if (platform) {
      where.platform = platform;
    }

    // 查询数据库，按开始时间升序排列
    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(contests);
  } catch (error) {
    // 数据库或其他运行时异常，返回 500
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
