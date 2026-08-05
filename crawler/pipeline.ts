/**
 * 竞赛数据清洗管道
 * 接收各爬虫返回的比赛数据，去重后批量写入 PostgreSQL 数据库。
 * 依赖 contests 表的唯一约束 (name + platform + startTime) 实现原子去重，
 * 通过 createMany + skipDuplicates 一次查询批量插入，避免逐条 N+1 查询。
 */

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireEnv } from "./env";

/** 比赛数据的通用输入类型 */
export interface ContestInput {
  name: string;
  platform: string;
  startTime: Date;
  /** 结束时间（如未提供则按 duration 推算） */
  endTime?: Date;
  /** 比赛时长（分钟，如未提供则按结束时间推算） */
  duration?: number;
  url: string;
}

/** 管道执行结果 */
export interface PipelineResult {
  /** 总共接收到的比赛数 */
  total: number;
  /** 成功新插入的比赛数 */
  inserted: number;
  /** 因重复跳过的比赛数 */
  skipped: number;
}

/** Prisma 客户端实例（惰性初始化） */
let prisma: PrismaClient | null = null;

/**
 * 获取 Prisma 客户端实例（单例）
 * 启动时校验 DATABASE_URL，缺失立即抛出明确错误。
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    const connectionString = requireEnv(
      "DATABASE_URL",
      "请配置 crawler/.env 或根目录 .env 中的 PostgreSQL 连接串"
    );
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * 计算结束时间：优先使用提供的 endTime，否则按 duration 推算
 */
export function computeEndTime(contest: ContestInput): Date {
  if (contest.endTime) return contest.endTime;
  if (contest.duration) {
    return new Date(contest.startTime.getTime() + contest.duration * 60 * 1000);
  }
  return contest.startTime;
}

/**
 * 计算时长（分钟）：优先使用提供的 duration，否则按日期差推算
 */
export function computeDuration(contest: ContestInput, endTime: Date): number {
  if (contest.duration) return contest.duration;
  return Math.round(
    (endTime.getTime() - contest.startTime.getTime()) / (60 * 1000)
  );
}

/**
 * 执行数据清洗管道
 * 使用 createMany + skipDuplicates 批量插入，由数据库唯一约束去重。
 *
 * @param contests 比赛数据数组（来自各爬虫的解析结果）
 * @returns 管道执行结果（总数、插入数、跳过数）
 */
export async function runPipeline(
  contests: ContestInput[]
): Promise<PipelineResult> {
  if (contests.length === 0) {
    return { total: 0, inserted: 0, skipped: 0 };
  }

  const client = getPrisma();

  // 统一计算 endTime / duration 后批量写入
  const data = contests.map((contest) => {
    const endTime = computeEndTime(contest);
    const duration = computeDuration(contest, endTime);
    return {
      name: contest.name,
      platform: contest.platform,
      startTime: contest.startTime,
      endTime,
      duration,
      url: contest.url,
    };
  });

  const result = await client.contest.createMany({
    data,
    skipDuplicates: true,
  });

  return {
    total: contests.length,
    inserted: result.count,
    skipped: contests.length - result.count,
  };
}

/**
 * 清理已结束超过保留期的历史比赛，防止数据无限膨胀
 * @param maxAgeDays - 保留天数（默认 30 天，以比赛结束时间为准）
 * @returns 删除的记录数
 */
export async function cleanupOldContests(maxAgeDays = 30): Promise<number> {
  const client = getPrisma();
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
  const result = await client.contest.deleteMany({
    where: { endTime: { lt: cutoff } },
  });
  return result.count;
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
