/**
 * 主题切换按钮组件
 * 在亮色 / 暗色模式之间切换，偏好持久化到 localStorage，
 * 未设置时跟随系统主题（由 layout 中的初始化脚本设置 class）。
 * 使用 useSyncExternalStore 订阅 localStorage，避免闪烁且无 hydration 冲突。
 */
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/** 主题模式类型 */
type Theme = "light" | "dark";

const STORAGE_KEY = "oier-tool-theme";

/** 主题变更自定义事件名（同标签页内通知 store 刷新） */
const THEME_CHANGE_EVENT = "oier-tool-theme-change";

/**
 * 订阅主题变化：跨标签页靠 storage 事件，同标签页靠自定义事件
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

/**
 * 读取当前主题：优先 localStorage，其次跟随系统
 */
function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  // 主题变化时应用到 <html> 根元素
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    // 同标签页内不会触发 storage 事件，需手动通知订阅者立即刷新
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-95"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
