/**
 * Vitest 单元测试配置
 * 使用 jsdom 模拟浏览器环境，测试文件指向根级 tests/web/ 目录。
 * React 组件测试通过 @vitejs/plugin-react 支持，路径别名 @/ 指向 web/。
 * 依赖已通过 npm workspaces 提升到根级 node_modules，无需额外 alias。
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // jest-dom 扩展断言（toBeInTheDocument 等）需要 globals 模式
    globals: true,
    // 模拟浏览器 DOM 环境
    environment: "jsdom",
    // 测试文件匹配路径（指向根级 tests/web/ 目录）
    include: ["../tests/web/**/*.test.{ts,tsx}"],
    // 引入 jest-dom 扩展断言
    setupFiles: ["../tests/web/setup.ts"],
  },
  resolve: {
    alias: {
      // 与 tsconfig.json 的 paths 一致：@/ → web/
      "@": path.resolve(__dirname),
    },
  },
});
