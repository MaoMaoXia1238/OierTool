/**
 * CodeMirror 编辑器主题
 * 编辑器外观（背景、行号槽、光标、选区、补全弹窗等）全部引用站点 CSS 变量
 * （--card / --muted / --border / --primary 等），自动适配明暗模式；
 * 语法高亮配色采用 GitHub 风格，按明暗模式提供两套。
 */
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

/** 编辑器外观主题（明暗共用，颜色取自站点主题变量） */
const chromeTheme = EditorView.theme({
  "&": {
    // 编辑区背景与工具栏/状态栏（--card）区分，令牌定义在 globals.css
    backgroundColor: "var(--ide-editor-bg)",
    color: "var(--card-foreground)",
    height: "100%",
    // 注意：不在这里设置 fontSize / fontFamily —— 由组件通过容器内联样式控制，
    // 利用 CSS 继承实现字体/字号的实时切换（CodeMirror 主题样式表挂载顺序不可靠）
  },
  "&.cm-focused": {
    outline: "none",
  },
  // 字体强制继承：CodeMirror 基础主题给 .cm-scroller 和补全列表写死了
  // font-family: monospace，覆盖为 inherit 才能跟随工具栏选择的字体
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "1.7",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "inherit",
  },
  ".cm-content": {
    padding: "16px 0",
    caretColor: "var(--foreground)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--foreground)",
    borderLeftWidth: "2px",
  },
  // 行号槽（背景与编辑区一致，视觉上同属代码区域；
  // 注意：不能加垂直 padding，CodeMirror 按行位置绝对定位行号，
  // 容器 padding 会导致行号与代码行错位；字体随编辑器继承）
  ".cm-gutters": {
    backgroundColor: "var(--ide-editor-bg)",
    color: "var(--muted-foreground)",
    border: "none",
    borderRight: "1px solid var(--border)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 8px",
    minWidth: "2.5em",
    // 行号字号必须跟随代码字号（继承），单独设置会导致行号槽与代码行错位
  },
  // 折叠箭头：flex 垂直居中，避免与代码行错位；
  // 内部字符 span 行高归一，消除 "⌄"/"›" 字符行盒空隙造成的展开/折叠视觉偏移
  ".cm-foldGutter .cm-gutterElement": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
    cursor: "pointer",
    color: "var(--muted-foreground)",
  },
  ".cm-foldGutter .cm-gutterElement > span": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  },
  ".cm-foldGutter .cm-gutterElement:hover": {
    color: "var(--foreground)",
  },
  // 当前行与选区
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--muted) 55%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "oklch(0.7 0.08 250 / 0.3)",
  },
  ".cm-selectionMatch": {
    backgroundColor: "oklch(0.7 0.08 250 / 0.2)",
  },
  // 括号匹配
  ".cm-matchingBracket": {
    backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)",
    outline: "1px solid color-mix(in oklab, var(--primary) 35%, transparent)",
    borderRadius: "2px",
  },
  ".cm-nonmatchingBracket": {
    backgroundColor: "color-mix(in oklab, var(--destructive) 20%, transparent)",
  },
  // 补全 / 提示弹窗（字体与字号随编辑器继承）
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "0 8px 24px oklch(0 0 0 / 0.12)",
    overflow: "hidden",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "3px 10px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-completionDetail": {
    color: "var(--muted-foreground)",
    fontStyle: "normal",
    marginLeft: "1em",
  },
  ".cm-completionMatchedText": {
    color: "var(--primary)",
    fontWeight: "600",
    textDecoration: "none",
  },
  // 面板（搜索框等）
  ".cm-panels": {
    backgroundColor: "var(--card)",
    color: "var(--card-foreground)",
  },
  ".cm-panels.cm-panels-top": {
    borderBottom: "1px solid var(--border)",
  },
  ".cm-panels.cm-panels-bottom": {
    borderTop: "1px solid var(--border)",
  },
});

/** 亮色语法高亮（GitHub Light 风格） */
const lightHighlight = HighlightStyle.define([
  { tag: [t.comment, t.blockComment], color: "#6e7781", fontStyle: "italic" },
  { tag: [t.keyword, t.modifier, t.controlKeyword], color: "#cf222e" },
  { tag: [t.string, t.special(t.string), t.character], color: "#0a3069" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#0550ae" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: "#8250df",
  },
  { tag: [t.typeName, t.className, t.namespace, t.macroName], color: "#953800" },
  { tag: [t.propertyName, t.attributeName], color: "#0550ae" },
  { tag: [t.operator], color: "#0550ae" },
  { tag: [t.punctuation], color: "#57606a" },
]);

/** 暗色语法高亮（GitHub Dark 风格） */
const darkHighlight = HighlightStyle.define([
  { tag: [t.comment, t.blockComment], color: "#8b949e", fontStyle: "italic" },
  { tag: [t.keyword, t.modifier, t.controlKeyword], color: "#ff7b72" },
  { tag: [t.string, t.special(t.string), t.character], color: "#a5d6ff" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#79c0ff" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: "#d2a8ff",
  },
  { tag: [t.typeName, t.className, t.namespace, t.macroName], color: "#ffa657" },
  { tag: [t.propertyName, t.attributeName], color: "#79c0ff" },
  { tag: [t.operator], color: "#ff7b72" },
  { tag: [t.punctuation], color: "#8b949e" },
]);

/**
 * 生成 IDE 编辑器主题扩展
 * @param dark 是否暗色模式（仅影响语法高亮配色，外观随 CSS 变量自动适配）
 */
export function ideTheme(dark: boolean): Extension {
  return [chromeTheme, syntaxHighlighting(dark ? darkHighlight : lightHighlight)];
}
