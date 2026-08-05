/**
 * 竞赛数据 DTO（数据传输对象）
 * 定义前端组件与 API 之间共享的竞赛数据结构，
 * 提供数据库模型 → DTO 的转换函数，统一字段规范化。
 */

/** 单条比赛数据（前端统一使用结构） */
export interface ContestData {
  id: string;
  name: string;
  platform: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration: number; // 单位：分钟
  url: string;
}

/** 数据库模型行（Prisma Contest 的必需字段子集） */
export interface ContestModelRow {
  id: string;
  name: string;
  platform: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration: number;
  url: string | null;
}

/**
 * 数据库模型 → 前端 DTO 转换
 * 规范化可选字段（null url → 空串），避免组件处理空值。
 */
export function toContestData(row: ContestModelRow): ContestData {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    startTime: row.startTime,
    ...(row.endTime ? { endTime: row.endTime } : {}),
    duration: row.duration,
    url: row.url ?? "",
  };
}
