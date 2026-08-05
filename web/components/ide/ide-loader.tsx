/**
 * 在线 IDE 加载器（客户端组件）
 * App Router 的服务端组件中不允许 ssr:false，因此在此客户端组件中
 * 通过 next/dynamic 禁用 SSR 加载编辑器本体（CodeMirror 依赖浏览器 API）。
 */
"use client";

import dynamic from "next/dynamic";

const IdeClient = dynamic(() => import("@/components/ide/ide-client"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground shadow-sm">
        编辑器加载中…
      </div>
    </div>
  ),
});

export default function IdeLoader() {
  return <IdeClient />;
}
