/**
 * 根布局组件
 * 定义整个应用的 HTML 结构、字体加载和全局元数据。
 * 所有页面都会嵌套在此布局中渲染。
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
