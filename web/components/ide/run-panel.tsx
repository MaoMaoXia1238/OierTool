/**
 * 在线 IDE 运行面板
 * 位于编辑器下方：左侧标准输入（stdin），右侧运行输出。
 * 输出区展示执行状态徽章（Accepted / Compilation Error / TLE 等）、
 * 耗时与内存，以及 stdout / stderr / 编译器输出。
 * 面板可通过头部按钮收起/展开。
 */
"use client";

import { useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ScrollText,
  SquareChevronRight,
} from "lucide-react";

/** 一次代码执行的结果（与 /api/execute 响应对应） */
export interface RunResult {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;
  memory: number | null;
}

/** 面板状态 */
export type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: RunResult }
  | { kind: "error"; message: string };

interface RunPanelProps {
  /** 当前运行状态 */
  state: RunState;
  /** stdin 内容与变更回调（由父组件持有，便于随草稿一并管理） */
  stdin: string;
  onStdinChange: (value: string) => void;
  /** 是否展开 */
  expanded: boolean;
  onToggle: () => void;
}

/** Judge0 状态 → 徽章样式（沿用站点语义色） */
function statusBadgeClass(statusId: number): string {
  if (statusId === 3) {
    // Accepted
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  }
  if (statusId === 6) {
    // Compilation Error
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  }
  if (statusId <= 2) {
    // In Queue / Processing
    return "bg-muted text-muted-foreground border-border";
  }
  // TLE / RE / MLE 等失败状态
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
}

export default function RunPanel({
  state,
  stdin,
  onStdinChange,
  expanded,
  onToggle,
}: RunPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // 新结果到达时滚动到输出顶部
  useEffect(() => {
    if (state.kind === "done" || state.kind === "error") {
      outputRef.current?.scrollTo({ top: 0 });
    }
  }, [state]);

  return (
    <div className="flex flex-col border-t">
      {/* ===== 面板头部 ===== */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          运行
          {state.kind === "running" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          {state.kind === "done" && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold ${statusBadgeClass(state.result.status.id)}`}
            >
              {state.result.status.description}
              {state.result.time != null && (
                <span className="font-normal opacity-80">
                  {state.result.time}s
                </span>
              )}
              {state.result.memory != null && (
                <span className="font-normal opacity-80">
                  {(state.result.memory / 1024).toFixed(1)}MB
                </span>
              )}
            </span>
          )}
          {state.kind === "error" && (
            <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-semibold text-red-600 dark:text-red-400">
              请求失败
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {/* ===== 面板主体：输入/输出子卡片，固定高度，编辑器保持弹性占满剩余空间 ===== */}
      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t bg-muted/20 p-3 sm:grid-cols-2">
          {/* 标准输入 */}
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-colors focus-within:border-primary/40">
            <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <SquareChevronRight className="h-3.5 w-3.5" />
              输入 (stdin)
            </div>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="在此填写程序的标准输入…"
              spellCheck={false}
              className="h-32 w-full resize-none bg-transparent p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          {/* 运行输出 */}
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ScrollText className="h-3.5 w-3.5" />
              输出
            </div>
            <div
              ref={outputRef}
              className="h-32 overflow-auto p-3 font-mono text-sm leading-relaxed"
            >
              {state.kind === "idle" && (
                <span className="text-muted-foreground/50">
                  点击「运行」或按 Ctrl+Enter 执行代码
                </span>
              )}
              {state.kind === "running" && (
                <span className="text-muted-foreground">
                  正在编译并运行，请稍候…
                </span>
              )}
              {state.kind === "error" && (
                <span className="text-red-600 dark:text-red-400">
                  {state.message}
                </span>
              )}
              {state.kind === "done" && (
                <>
                  {state.result.compileOutput && (
                    <pre className="mb-2 whitespace-pre-wrap break-all text-amber-600 dark:text-amber-400">
                      {state.result.compileOutput}
                    </pre>
                  )}
                  {state.result.stderr && (
                    <pre className="mb-2 whitespace-pre-wrap break-all text-red-600 dark:text-red-400">
                      {state.result.stderr}
                    </pre>
                  )}
                  {state.result.stdout ? (
                    <pre className="whitespace-pre-wrap break-all">
                      {state.result.stdout}
                    </pre>
                  ) : (
                    !state.result.compileOutput &&
                    !state.result.stderr && (
                      <span className="text-muted-foreground/50">
                        （无输出）
                      </span>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
