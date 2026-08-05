/**
 * 应用级错误边界（客户端组件）
 * 页面渲染抛出未捕获错误时展示友好提示，并提供「重新加载」操作。
 */
"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">页面出错了</h1>
      <p className="text-sm text-muted-foreground">
        加载过程中发生意外错误
        {error.digest ? (
          <span className="ml-1 font-mono text-xs">（{error.digest}）</span>
        ) : null}
        ，请稍后重试。
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          重新加载
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
