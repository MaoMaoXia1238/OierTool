/**
 * Prisma Client 单例模块
 * 导出全局唯一的 PrismaClient 实例。
 * 遵循 Next.js 官方建议，使用 globalThis 缓存避免开发时热重载创建多个数据库连接。
 * 启动时校验 DATABASE_URL，缺失立即抛出明确错误。
 */

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireEnv } from "./env";

// globalThis 上没有 prisma 属性时创建一个新的 PrismaClient 实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建 PrismaClient 的工厂函数（Prisma v7 要求通过 adapter 连接数据库）
function createPrisma(): PrismaClient {
  const connectionString = requireEnv(
    "DATABASE_URL",
    "请配置 web/.env 中的 PostgreSQL 连接串"
  );
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// 如果已有缓存实例则复用，否则创建新实例
export const prisma = globalForPrisma.prisma ?? createPrisma();

// 非生产环境下将实例挂载到 globalThis，避免热重载时重复创建
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
