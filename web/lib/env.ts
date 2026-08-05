/**
 * Web 环境变量校验工具
 * 启动时快速失败，避免因缺失配置产生晦涩的运行时错误。
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
