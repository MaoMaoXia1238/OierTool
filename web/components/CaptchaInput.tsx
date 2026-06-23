/**
 * 图形验证码输入组件（客户端组件）
 * 渲染 SVG 验证码图片 + 4 位输入框 + 点击刷新按钮。
 * 使用 dangerouslySetInnerHTML 渲染 SVG，注意仅在信任的服务端返回数据上使用。
 */
"use client";

import { useState, useCallback, useEffect } from "react";

interface CaptchaInputProps {
  onCaptchaReady: (captchaId: string) => void;
  onAnswerChange: (answer: string) => void;
  error?: string;
}

export default function CaptchaInput({
  onCaptchaReady,
  onAnswerChange,
  error,
}: CaptchaInputProps) {
  const [svg, setSvg] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/captcha");
      const data = await res.json();
      setSvg(data.svg);
      setAnswer("");
      onCaptchaReady(data.captchaId);
      onAnswerChange("");
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [onCaptchaReady, onAnswerChange]);

  // 首次挂载时获取验证码
  useEffect(() => {
    const timer = setTimeout(() => fetchCaptcha(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setAnswer(cleaned);
    onAnswerChange(cleaned);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">图形验证码</label>
      <div className="flex items-center gap-2">
        {/* SVG 图片（点击刷新） */}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          className="shrink-0 rounded-lg border overflow-hidden hover:border-primary transition-colors disabled:opacity-50"
          title="点击刷新"
        >
          {loading ? (
            <div className="w-[120px] h-[44px] flex items-center justify-center text-xs text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div
              className="w-[120px] h-[44px]"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </button>

        {/* 受控输入框 */}
        <input
          type="text"
          inputMode="text"
          maxLength={4}
          value={answer}
          placeholder="4位验证码"
          autoComplete="off"
          onChange={(e) => handleChange(e.target.value)}
          className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-mono tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-ring transition-shadow ${
            error ? "border-destructive" : "border-border"
          } bg-background`}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
