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

/**
 * 需要放大显示的 Logo 平台列表
 * 某些 SVG 内嵌留白大或宽高比特殊，在统一 24x24 容器中显得小
 */
const LARGE_LOGO_PLATFORMS = new Set(["AtCoder", "LeetCode"]);

/**
 * 获取平台 Logo 的尺寸类名
 * AtCoder / LeetCode 的 Logo 默认留有较多空白或宽高比特殊，需放大显示
 */
export function getLogoSizeClass(platform: string): string {
  return LARGE_LOGO_PLATFORMS.has(platform) ? "h-8 w-8" : "h-6 w-6";
}
