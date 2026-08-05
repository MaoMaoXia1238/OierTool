/**
 * 在线 IDE 核心客户端组件
 * 基于 CodeMirror 6 的网页代码编辑器：
 * - C++ / Python / Java 语法高亮与关键字补全
 * - 竞赛常用代码片段补全（输入前缀触发）
 * - 明暗主题跟随站点主题自动切换
 * - 草稿按语言分别自动保存到 localStorage，刷新不丢失
 * - 工具栏：语言切换、复制代码、下载文件、重置为模板
 *
 * 注意：本组件依赖浏览器 API，必须通过 next/dynamic(ssr: false) 加载。
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp, cppLanguage } from "@codemirror/lang-cpp";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { java, javaLanguage } from "@codemirror/lang-java";
import { completeFromList } from "@codemirror/autocomplete";
import { indentUnit } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { Check, Copy, Download, Loader2, Minus, Play, Plus, RotateCcw } from "lucide-react";
import { ideTheme } from "@/components/ide/editor-theme";
import RunPanel, { type RunState } from "@/components/ide/run-panel";
import {
  DEFAULT_TEMPLATES,
  LANGUAGE_META,
  LANGUAGE_SNIPPETS,
  type IdeLanguage,
} from "@/components/ide/snippets";
// 自托管代码字体（随 IDE 懒加载 chunk 打包，从本站加载，不依赖外部 CDN）
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/fira-code/400.css";
import "@fontsource/cascadia-code/400.css";
import "@fontsource/maple-mono/400.css";

/** 语言切换顺序（C++ 为默认） */
const LANGUAGE_ORDER: IdeLanguage[] = ["cpp", "python", "java"];

/**
 * 可选代码字体。
 * 前四种随站点自托管（@fontsource），所有访客均可真实生效；
 * 其余为本地系统字体栈，未安装时自动回退。
 */
const FONT_OPTIONS = [
  { id: "system", label: "系统等宽", stack: "var(--font-mono)" },
  {
    id: "jetbrains",
    label: "JetBrains Mono",
    stack: '"JetBrains Mono", var(--font-mono)',
  },
  { id: "fira", label: "Fira Code", stack: '"Fira Code", var(--font-mono)' },
  {
    id: "cascadia",
    label: "Cascadia Code",
    stack: '"Cascadia Code", var(--font-mono)',
  },
  {
    id: "maple",
    label: "Maple Mono",
    stack: '"Maple Mono", var(--font-mono)',
  },
  { id: "consolas", label: "Consolas", stack: 'Consolas, var(--font-mono)' },
] as const;

type FontId = (typeof FONT_OPTIONS)[number]["id"];

/** 字号范围与默认值 */
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 22;
const FONT_SIZE_DEFAULT = 14;

/** 字体 / 字号 localStorage 键 */
const FONT_STORAGE_KEY = "oiertool-ide-font";
const FONT_SIZE_STORAGE_KEY = "oiertool-ide-font-size";

/** 读取保存的字体设置 */
function loadFont(): FontId {
  try {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    if (FONT_OPTIONS.some((f) => f.id === saved)) return saved as FontId;
  } catch {
    // 忽略
  }
  return "system";
}

/** 读取保存的字号设置 */
function loadFontSize(): number {
  try {
    const n = Number(localStorage.getItem(FONT_SIZE_STORAGE_KEY));
    if (n >= FONT_SIZE_MIN && n <= FONT_SIZE_MAX) return n;
  } catch {
    // 忽略
  }
  return FONT_SIZE_DEFAULT;
}

/** 读取指定语言的草稿，无草稿时回退到默认模板 */
function loadDraft(lang: IdeLanguage): string {
  try {
    const saved = localStorage.getItem(LANGUAGE_META[lang].draftKey);
    if (saved !== null) return saved;
  } catch {
    // localStorage 不可用（隐私模式等）时静默回退
  }
  return DEFAULT_TEMPLATES[lang];
}

/** 保存指定语言的草稿 */
function saveDraft(lang: IdeLanguage, code: string): void {
  try {
    localStorage.setItem(LANGUAGE_META[lang].draftKey, code);
  } catch {
    // 忽略写入失败
  }
}

/** stdin 输入的 localStorage 键 */
const STDIN_STORAGE_KEY = "oiertool-ide-stdin";

/** 读取保存的 stdin */
function loadStdin(): string {
  try {
    return localStorage.getItem(STDIN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function IdeClient() {
  const [language, setLanguage] = useState<IdeLanguage>("cpp");
  // 组件经 dynamic(ssr:false) 加载，惰性初始化只在浏览器执行，可安全读 localStorage
  const [code, setCode] = useState<string>(() => loadDraft("cpp"));
  const [dark, setDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );
  const [copied, setCopied] = useState(false);
  const [fontId, setFontId] = useState<FontId>(() => loadFont());
  const [fontSize, setFontSize] = useState<number>(() => loadFontSize());
  /** 运行面板状态与 stdin（stdin 持久化到 localStorage） */
  const [runState, setRunState] = useState<RunState>({ kind: "idle" });
  const [stdin, setStdinState] = useState<string>(() => loadStdin());
  const [panelExpanded, setPanelExpanded] = useState(false);
  /** 编辑器实例引用（用于字体变化后主动触发重新测量） */
  const viewRef = useRef<EditorView | null>(null);

  // 监听站点主题切换（theme-toggle 修改 html.dark 类），编辑器主题跟随
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 字体/字号变化后强制编辑器重建视图：CodeMirror 会缓存行号槽的内联行高，
  // requestMeasure 无法检测外部 CSS 字体变化，setState(同一 state) 可触发完整重建，
  // 且选区、滚动位置、撤销历史均保留（state 对象不变）
  useEffect(() => {
    const view = viewRef.current;
    if (view) view.setState(view.state);
  }, [fontId, fontSize]);

  // 编辑内容变化时实时保存草稿（代码量小，直接同步写 localStorage）
  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      saveDraft(language, value);
    },
    [language]
  );

  /** 更新 stdin 并持久化 */
  const setStdin = (value: string) => {
    setStdinState(value);
    try {
      localStorage.setItem(STDIN_STORAGE_KEY, value);
    } catch {
      // 忽略
    }
  };

  /** 运行当前代码（Ctrl/Cmd+Enter 或点击运行按钮触发） */
  const runCode = useCallback(async () => {
    setRunState((s) => (s.kind === "running" ? s : { kind: "running" }));
    setPanelExpanded(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, sourceCode: code, stdin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunState({
          kind: "error",
          message: data.error ?? `请求失败（HTTP ${res.status}）`,
        });
        return;
      }
      setRunState({ kind: "done", result: data });
    } catch {
      setRunState({ kind: "error", message: "网络异常，请检查连接后重试" });
    }
  }, [language, code, stdin]);

  // 快捷键：Ctrl/Cmd + Enter 运行
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  /** 切换语言：加载对应语言的草稿（无草稿则载入模板） */
  const switchLanguage = (lang: IdeLanguage) => {
    if (lang === language) return;
    setLanguage(lang);
    setCode(loadDraft(lang));
  };

  /** 复制全部代码到剪贴板 */
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时忽略
    }
  };

  /** 将当前代码下载为对应扩展名的文件 */
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `main.${LANGUAGE_META[language].extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 重置为当前语言的默认模板 */
  const resetCode = () => {
    setCode(DEFAULT_TEMPLATES[language]);
    saveDraft(language, DEFAULT_TEMPLATES[language]);
  };

  /** 切换字体并持久化 */
  const changeFont = (id: FontId) => {
    setFontId(id);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, id);
    } catch {
      // 忽略
    }
  };

  /** 调整字号并持久化（限制在允许范围内） */
  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, prev + delta));
      try {
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(next));
      } catch {
        // 忽略
      }
      return next;
    });
  };

  // 编辑器扩展：站点主题 → 缩进单位 → 语言扩展 + 自定义竞赛片段补全
  // （字体/字号不走 CodeMirror 主题——其样式表挂载顺序不可靠，改由容器内联样式 + CSS 继承控制）
  // indentUnit 固定 4 空格：否则回车自动缩进用语言默认的 2 空格，与 Tab（tabSize=4）不一致
  const extensions = useMemo<Extension[]>(() => {
    const base: Extension[] = [ideTheme(dark), indentUnit.of("    ")];
    switch (language) {
      case "python":
        return [
          ...base,
          python(),
          pythonLanguage.data.of({
            autocomplete: completeFromList(LANGUAGE_SNIPPETS.python),
          }),
        ];
      case "java":
        return [
          ...base,
          java(),
          javaLanguage.data.of({
            autocomplete: completeFromList(LANGUAGE_SNIPPETS.java),
          }),
        ];
      default:
        return [
          ...base,
          cpp(),
          cppLanguage.data.of({
            autocomplete: completeFromList(LANGUAGE_SNIPPETS.cpp),
          }),
        ];
    }
  }, [language, dark]);

  /** 当前字体栈（用于编辑器容器内联样式，编辑器内部继承） */
  const fontStack =
    FONT_OPTIONS.find((f) => f.id === fontId)?.stack ?? "var(--font-mono)";

  /** 当前代码行数（状态栏展示） */
  const lineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* ===== 工具栏 ===== */}
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4">
          {/* 语言切换 */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {LANGUAGE_ORDER.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => switchLanguage(lang)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  lang === language
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {LANGUAGE_META[lang].label}
              </button>
            ))}
          </div>

          {/* 字体 / 字号设置 */}
          <div className="flex items-center gap-2">
            <select
              value={fontId}
              onChange={(e) => changeFont(e.target.value as FontId)}
              aria-label="代码字体"
              className="h-8 rounded-lg border bg-card px-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus:outline-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="flex items-center rounded-lg border bg-muted/40">
              <button
                type="button"
                onClick={() => changeFontSize(-1)}
                disabled={fontSize <= FONT_SIZE_MIN}
                aria-label="减小字号"
                className="inline-flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-medium text-muted-foreground tabular-nums">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => changeFontSize(1)}
                disabled={fontSize >= FONT_SIZE_MAX}
                aria-label="增大字号"
                className="inline-flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <span className="hidden text-xs text-muted-foreground xl:inline">
            输入前缀（如 <code className="rounded bg-muted px-1">bits</code>、
            <code className="rounded bg-muted px-1">fori</code>）可触发代码片段
          </span>

          {/* 操作按钮 */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={runCode}
              disabled={runState.kind === "running"}
              title="运行（Ctrl+Enter）"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
            >
              {runState.kind === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {runState.kind === "running" ? "运行中" : "运行"}
            </button>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              type="button"
              onClick={downloadCode}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              type="button"
              onClick={resetCode}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          </div>
        </div>

        {/* ===== 编辑器（容器内联字体/字号，编辑器内部 CSS 继承） ===== */}
        <div
          className="min-h-0 flex-1"
          style={{ fontSize: `${fontSize}px`, fontFamily: fontStack }}
        >
          <CodeMirror
            value={code}
            onChange={handleChange}
            onCreateEditor={(view) => {
              viewRef.current = view;
            }}
            extensions={extensions}
            theme="none"
            height="100%"
            style={{ height: "100%", fontSize: "inherit" }}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              highlightSelectionMatches: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              indentOnInput: true,
            }}
          />
        </div>

        {/* ===== 运行面板（输入 / 输出） ===== */}
        <RunPanel
          state={runState}
          stdin={stdin}
          onStdinChange={setStdin}
          expanded={panelExpanded}
          onToggle={() => setPanelExpanded((v) => !v)}
        />

        {/* ===== 状态栏 ===== */}
        <div className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground">
          <span>{LANGUAGE_META[language].label}</span>
          <span className="flex items-center gap-3">
            <span>{lineCount} 行</span>
            <span className="hidden sm:inline">草稿已自动保存到本地</span>
          </span>
        </div>
      </div>
    </div>
  );
}
