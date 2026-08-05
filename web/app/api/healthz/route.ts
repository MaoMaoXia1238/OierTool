/**
 * 健康检查接口
 * GET /api/healthz —— 检查服务状态：数据库连通性、最近爬虫执行时间。
 * 用于容器健康检查与运维监控。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** 健康检查超时（毫秒） */
const DB_TIMEOUT_MS = 5_000;

/**
 * 处理 GET /api/healthz
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    // 数据库连通性：轻量查询最近一次爬虫日志
    const latestLog = await Promise.race([
      prisma.crawlLog.findFirst({ orderBy: { createdAt: "desc" } }),
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error("数据库查询超时")),
          DB_TIMEOUT_MS
        )
      ),
    ]);

    // 最近爬取时间（判断爬虫是否存活）
    const lastCrawlAt = latestLog?.createdAt ?? null;
    const crawlAlive =
      !!lastCrawlAt &&
      Date.now() - lastCrawlAt.getTime() < 48 * 60 * 60 * 1000; // 48h 内

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        lastCrawlAt: lastCrawlAt ? lastCrawlAt.toISOString() : null,
        crawlAlive,
        uptime: Math.round(process.uptime()),
        latencyMs: Date.now() - startedAt,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[API] GET /api/healthz 检查失败:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}
