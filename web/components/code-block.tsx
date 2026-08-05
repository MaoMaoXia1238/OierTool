/**
 * 代码块组件（客户端）
 * 展示代码示例，带语言标签和一键复制按钮。
 */
"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

/** 代码块组件 Props */
export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "json" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  return (
    <div className="relative overflow-x-auto rounded-lg border bg-muted/60">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          {language.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              复制
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm leading-relaxed">
        <code className={`language-${language} text-muted-foreground`}>{code}</code>
      </pre>
    </div>
  );
}
