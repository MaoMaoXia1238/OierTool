/**
 * 爬虫模块环境变量校验
 * 启动时快速失败（fail fast），避免在运行时因缺失配置产生晦涩错误。
 */

/**
 * 读取并校验必需的字符串环境变量
 * @param name 环境变量名
 * @param hint 缺失时的提示信息（可选）
 * @throws 变量缺失时抛出明确错误
 */
export function requireEnv(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    const message = `缺少必需的环境变量: ${name}${hint ? `（${hint}）` : ""}`;
    throw new Error(message);
  }
  return value;
}
