/**
 * 根布局组件
 * 定义整个应用的 HTML 结构、字体加载和全局元数据。
 * 所有页面都会嵌套在此布局中渲染。
 * 包含顶部导航栏（NavBar）和底部页脚（Footer）。
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// 加载 Geist Sans 字体（无衬线）
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 加载 Geist Mono 字体（等宽，用于代码展示）
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 全局 SEO 元数据
export const metadata: Metadata = {
  title: "OierTool",
  description: "算法竞赛选手工具站 - 竞赛日历、数据聚合",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-medium">OierTool</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              算法竞赛选手的随身工具站
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              MIT License · Built with Next.js &amp; PostgreSQL
            </p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link
                href="https://github.com/MaoMaoXia1238/OierTool"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
              <span>Next.js 16 + Prisma 7</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
