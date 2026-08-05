/**
 * 爬虫模块 ESLint 配置
 * 使用 typescript-eslint 推荐规则集（与 web 的 Next 配置共享同一依赖）。
 */
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);
