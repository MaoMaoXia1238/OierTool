/**
 * ESLint 代码检查配置
 * 继承 Next.js 官方推荐的 Web Vitals 和 TypeScript 规则集，
 * 确保代码质量和最佳实践。
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 覆盖默认忽略规则
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
