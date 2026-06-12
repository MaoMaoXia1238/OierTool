/**
 * 爬虫模块 Vitest 测试配置
 * 测试文件路径指向项目根目录下的 tests/crawler/ 目录，
 * 用于验证爬虫解析逻辑的正确性。
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 测试文件匹配路径（指向统一的 tests/ 目录）
    include: ["../tests/crawler/**/*.test.ts"],
  },
});
