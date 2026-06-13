/**
 * 竞赛平台 Logo 常量映射
 * 将平台名称映射到 /public/logos/ 目录下的对应 SVG 文件路径。
 * 添加新平台时只需在此对象中新增条目。
 */

/** 平台名称 → Logo 文件路径的映射表 */
export const PLATFORM_LOGOS: Record<string, string> = {
  /** Codeforces 平台 Logo */
  Codeforces: "/logos/codeforces.svg",
  /** Luogu（洛谷）平台 Logo */
  Luogu: "/logos/luogu.svg",
  /** NowCoder（牛客）平台 Logo */
  NowCoder: "/logos/nowcoder.svg",
  /** AtCoder 平台 Logo */
  AtCoder: "/logos/atcoder.svg",
  /** LeetCode 平台 Logo */
  LeetCode: "/logos/leetcode.svg",
};

/**
 * 根据平台名称获取对应的 Logo 路径
 * @param platform - 平台名称（如 "Codeforces"、"Luogu"）
 * @returns Logo 文件的 URL 路径，未知平台返回 undefined
 */
export function getPlatformLogo(platform: string): string | undefined {
  return PLATFORM_LOGOS[platform];
}
