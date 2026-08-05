/**
 * Next.js 项目配置文件
 * 定义构建和运行时配置选项。
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移除 X-Powered-By 响应头，降低信息泄露
  poweredByHeader: false,
  // 生产环境开启严格模式（默认已启用，显式声明）
  reactStrictMode: true,
};

export default nextConfig;
