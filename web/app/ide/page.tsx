/**
 * 在线 IDE 页面（/ide）
 * 服务端组件，仅提供 SEO 元数据；
 * 编辑器本体经客户端加载器禁用 SSR 加载（CodeMirror 依赖浏览器 API）。
 */
import type { Metadata } from "next";
import IdeLoader from "@/components/ide/ide-loader";

export const metadata: Metadata = {
  title: "在线 IDE - OierTool",
  description:
    "网页版代码编辑器，支持 C++ / Python / Java 语法高亮与竞赛代码片段补全，草稿自动本地保存。",
};

export default function IdePage() {
  return <IdeLoader />;
}
