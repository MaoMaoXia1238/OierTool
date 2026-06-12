/**
 * Playwright E2E 端到端测试配置
 * 模拟真实浏览器（Chromium）验证用户操作流程。
 * 测试文件位于 tests/e2e/ 目录。
 * 从 web/ 移至根目录，作为项目级配置。
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  // E2E 测试文件目录
  testDir: "tests/e2e",
  use: {
    // 测试时的基础 URL（对应 Next.js 开发服务器）
    baseURL: "http://localhost:3000",
  },
  // 自动启动开发服务器
  webServer: {
    command: "npm run dev",
    port: 3000,
    // Next.js 项目在 web/ 目录下
    cwd: "web",
    reuseExistingServer: !process.env.CI,
  },
});
