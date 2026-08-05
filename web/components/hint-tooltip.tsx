/**
 * 悬停提示组件
 * 鼠标悬停/聚焦时在下方弹出说明气泡，用于告知按钮功能与使用方法。
 */
import { useState } from "react";

/** HintTooltip 组件 Props */
export interface HintTooltipProps {
  /** 提示内容 */
  content: string;
  /** 子元素（被提示的按钮等） */
  children: React.ReactNode;
}

export function HintTooltip({ content, children }: HintTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border bg-popover px-3.5 py-2.5 text-left text-xs leading-relaxed text-popover-foreground shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  );
}
