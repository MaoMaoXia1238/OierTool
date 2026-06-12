/**
 * Prisma Client 单例模块
 * 导出全局唯一的 PrismaClient 实例。
 * 遵循 Next.js 官方建议，使用 globalThis 缓存避免开发时热重载创建多个数据库连接。
 */

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// globalThis 上没有 prisma 属性时创建一个新的 PrismaClient 实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建 PrismaClient 的工厂函数（Prisma v7 要求通过 adapter 连接数据库）
function createPrisma(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

// 如果已有缓存实例则复用，否则创建新实例
export const prisma = globalForPrisma.prisma ?? createPrisma();

// 非生产环境下将实例挂载到 globalThis，避免热重载时重复创建
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
