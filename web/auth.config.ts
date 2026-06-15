/**
 * Auth.js v5 边缘安全配置
 * 包含 providers 声明和 callbacks，不依赖数据库 adapter。
 * 此文件可在 proxy.ts 中直接导入（Edge Runtime 兼容）。
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // AUTH_SECRET 优先从环境变量读取，开发环境使用默认值
  // 生产部署时通过 Vercel 环境变量设置真实的 AUTH_SECRET
  secret: process.env.AUTH_SECRET || "oier-tool-dev-secret-change-in-production",
  providers: [],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // 路由保护回调：当前阶段所有页面公开访问
    authorized() {
      // 返回 true 允许所有请求通过
      // 后续可在此添加需要登录的路由判断
      return true;
    },
  },
  session: {
    strategy: "jwt", // 使用 JWT 策略（无状态）
  },
};
