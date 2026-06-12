/**
 * 竞赛数据清洗管道
 * 接收各爬虫返回的比赛数据，进行去重处理后写入 PostgreSQL 数据库。
 * 使用 Prisma Client 操作 contests 表，通过 name + platform + startTime 进行去重。
 */

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 比赛数据的通用输入类型
export interface ContestInput {
  name: string;
  platform: string;
  startTime: Date;
  /** 结束时间（Codeforces 如未提供则自动按 duration 计算） */
  endTime?: Date;
  /** 比赛时长（分钟） */
  duration?: number;
  url: string;
}

// 管道执行结果
export interface PipelineResult {
  /** 总共接收到的比赛数 */
  total: number;
  /** 成功新插入的比赛数 */
  inserted: number;
  /** 因重复跳过的比赛数 */
  skipped: number;
}

// Prisma 客户端实例（惰性初始化）
let prisma: PrismaClient | null = null;

/**
 * 获取 Prisma 客户端实例
 * 使用单例模式避免重复创建连接。
 * Prisma v7 要求通过 adapter（驱动适配器）连接数据库。
 */
function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * 执行数据清洗管道
 * 遍历传入的比赛数组，逐条去重后插入 contests 表。
 * 去重规则：name + platform + startTime 三者均相同视为重复。
 *
 * @param contests 比赛数据数组（来自各爬虫的解析结果）
 * @returns 管道执行结果（总数、插入数、跳过数）
 */
export async function runPipeline(
  contests: ContestInput[]
): Promise<PipelineResult> {
  const client = getPrisma();

  let inserted = 0;
  let skipped = 0;

  for (const contest of contests) {
    // 去重：查询数据库中是否已存在相同 name + platform + startTime 的记录
    const existing = await client.contest.findFirst({
      where: {
        name: contest.name,
        platform: contest.platform,
        startTime: contest.startTime,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // 计算 endTime：优先使用提供的 endTime，否则按 duration 推算
    const endTime =
      contest.endTime ??
      (contest.duration
        ? new Date(contest.startTime.getTime() + contest.duration * 60 * 1000)
        : contest.startTime);

    // 计算 duration：优先使用提供的 duration，否则按日期差推算
    const duration =
      contest.duration ??
      Math.round(
        (endTime.getTime() - contest.startTime.getTime()) / (60 * 1000)
      );

    // 写入数据库
    await client.contest.create({
      data: {
        name: contest.name,
        platform: contest.platform,
        startTime: contest.startTime,
        endTime,
        duration,
        url: contest.url,
      },
    });

    inserted++;
  }

  return {
    total: contests.length,
    inserted,
    skipped,
  };
}

/**
 * 断开 Prisma 客户端连接
 * 在应用关闭时调用，释放数据库连接资源
 */
export async function disconnectPipeline(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
