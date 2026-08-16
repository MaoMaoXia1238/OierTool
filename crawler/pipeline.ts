/**
 * 竞赛数据清洗管道
 * 接收各爬虫返回的比赛数据，去重后批量写入 PostgreSQL 数据库。
 * 依赖 contests 表的唯一约束 (name + platform + startTime) 实现原子去重。
 *
 * 按平台分组后逐平台 createMany + skipDuplicates：
 * - 保留批量写入性能（每个平台仍是一次批量插入）
 * - 让每个平台的 inserted / skipped 统计真实可用
 * - 单个平台数据异常不会拖垮其他平台
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

/** 单个平台的管道执行结果 */
export interface PlatformPipelineResult {
  total: number;
  inserted: number;
  skipped: number;
  /** 该平台写入失败时的错误信息 */
  error?: string;
}

/** 管道执行结果 */
export interface PipelineResult {
  /** 有效比赛总数 */
  total: number;
  /** 成功新插入的比赛数 */
  inserted: number;
  /** 因重复跳过的比赛数 */
  skipped: number;
  /** 因字段非法而丢弃的比赛数 */
  invalid: number;
  /** 各平台明细（platform -> result） */
  platforms: Record<string, PlatformPipelineResult>;
  /** 各平台写入失败信息（platform -> message） */
  errors: Record<string, string>;
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

function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 校验一条爬虫输入是否可写入数据库。
 * 外部站点结构可能变更，这里在写入前兜底过滤非法数据。
 */
export function isValidContestInput(contest: ContestInput): boolean {
  if (!contest || typeof contest !== "object") return false;
  if (typeof contest.name !== "string" || !contest.name.trim()) return false;
  if (typeof contest.platform !== "string" || !contest.platform.trim()) return false;
  if (typeof contest.url !== "string") return false;
  if (!isDate(contest.startTime)) return false;
  if (contest.endTime !== undefined && !isDate(contest.endTime)) return false;
  if (
    contest.duration !== undefined &&
    (typeof contest.duration !== "number" ||
      !Number.isFinite(contest.duration) ||
      contest.duration <= 0)
  ) {
    return false;
  }
  return true;
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
  const minutes = Math.round(
    (endTime.getTime() - contest.startTime.getTime()) / (60 * 1000)
  );
  // 结束时间早于或等于开始时间且未给 duration 时，按 0 处理，由后续统计观察。
  return Math.max(0, minutes);
}

/**
 * 将一条输入规范化为可批量写入的数据库行。
 */
export function toContestRow(contest: ContestInput) {
  const endTime = computeEndTime(contest);
  return {
    name: contest.name.trim(),
    platform: contest.platform.trim(),
    startTime: contest.startTime,
    endTime,
    duration: computeDuration(contest, endTime),
    url: contest.url.trim(),
  };
}

/**
 * 执行数据清洗管道。
 *
 * @param contests 比赛数据数组（来自各爬虫的解析结果）
 * @returns 管道执行结果（有效总数、插入数、跳过数、非法数与平台明细）
 */
export async function runPipeline(
  contests: ContestInput[]
): Promise<PipelineResult> {
  const valid = contests.filter(isValidContestInput);
  const result: PipelineResult = {
    total: valid.length,
    inserted: 0,
    skipped: 0,
    invalid: contests.length - valid.length,
    platforms: {},
    errors: {},
  };

  if (valid.length === 0) return result;

  const client = getPrisma();
  const groups = new Map<string, ContestInput[]>();
  for (const contest of valid) {
    const platform = contest.platform.trim();
    const rows = groups.get(platform) ?? [];
    rows.push(contest);
    groups.set(platform, rows);
  }

  // 逐平台批量写入。平台间相互隔离，且能拿到每个平台真实的插入/跳过统计。
  for (const [platform, rows] of groups) {
    const data = rows.map(toContestRow);
    try {
      const outcome = await client.contest.createMany({
        data,
        skipDuplicates: true,
      });

      result.inserted += outcome.count;
      result.skipped += data.length - outcome.count;
      result.platforms[platform] = {
        total: data.length,
        inserted: outcome.count,
        skipped: data.length - outcome.count,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors[platform] = message;
      result.platforms[platform] = {
        total: data.length,
        inserted: 0,
        skipped: 0,
        error: message,
      };
    }
  }

  return result;
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
