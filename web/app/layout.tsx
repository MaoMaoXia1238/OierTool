/**
 * 根布局组件
 * 定义整个应用的 HTML 结构、字体加载和全局元数据。
 * 所有页面都会嵌套在此布局中渲染。
 * 包含顶部导航栏（NavBar）和底部页脚（Footer）。
 * 主题通过 cookie 在服务端渲染（避免内联脚本警告与暗色模式闪烁）。
 */
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// 全局 SEO 元数据
export const metadata: Metadata = {
  title: "OierTool",
  description: "算法竞赛选手工具站 - 竞赛日历、数据聚合",
};

/** 主题 cookie 名称（与 theme-toggle 保持一致） */
export const THEME_COOKIE = "oier-tool-theme";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 服务端读取主题偏好，直接渲染 html class，避免闪烁与内联脚本
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  const dark = theme === "dark";

  return (
    <html lang="zh-CN" className={`${dark ? "dark " : ""}h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />
        <footer className="border-t bg-card/40 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-3">
              {/* 品牌信息 */}
              <div>
                <p className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  OierTool
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  算法竞赛选手的随身工具站，一站式管理各大 OJ 竞赛日程。
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {["Codeforces", "AtCoder", "Luogu", "NowCoder", "LeetCode"].map(
                    (p) => (
                      <span
                        key={p}
                        className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {p}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* 快速导航 */}
              <div>
                <p className="mb-3 text-sm font-semibold">快速导航</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="transition-colors hover:text-foreground">
                      首页
                    </Link>
                  </li>
                  <li>
                    <Link href="/calendar" className="transition-colors hover:text-foreground">
                      竞赛日历
                    </Link>
                  </li>
                  <li>
                    <Link href="/ide" className="transition-colors hover:text-foreground">
                      在线 IDE
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="transition-colors hover:text-foreground">
                      API 文档
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 开源信息 */}
              <div>
                <p className="mb-3 text-sm font-semibold">开源项目</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link
                      href="https://github.com/MaoMaoXia1238/OierTool"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      GitHub 仓库
                    </Link>
                  </li>
                  <li>
                    <span className="cursor-default">MIT License</span>
                  </li>
                  <li>
                    <span className="cursor-default">
                      Next.js 16 · Prisma 7 · PostgreSQL
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground/70 sm:flex-row">
              <p>© {new Date().getFullYear()} OierTool · 算法竞赛选手的随身工具站</p>
              <p>Built with Next.js &amp; PostgreSQL · 数据每日自动同步</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
