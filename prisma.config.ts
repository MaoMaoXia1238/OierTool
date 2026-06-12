/**
 * Prisma CLI 配置文件
 * Prisma v7 要求将数据库连接 URL 从 schema.prisma 移到此配置文件中。
 * 供 prisma migrate、prisma generate 等 CLI 命令读取。
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Prisma schema 文件路径（相对于项目根目录）
  schema: "web/prisma/schema.prisma",
  // 数据库连接配置
  datasource: {
    // 使用 process.env 而非 env()，避免 prisma generate 时因缺少环境变量而失败
    url: process.env.DATABASE_URL ?? "",
  },
});
