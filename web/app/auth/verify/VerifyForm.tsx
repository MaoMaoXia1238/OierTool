/**
 * 邮箱验证表单组件（客户端组件）
 * 提供 6 位验证码输入、提交验证和重新发送功能。
 * 重新发送时需先输入图形验证码。
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CaptchaInput from "@/components/CaptchaInput";

export default function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // 重新发送倒计时
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("请输入 6 位验证码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "验证失败");
      } else {
        router.push("/auth/signin?verified=true");
      }
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function startResend() {
    setShowCaptcha(true);
    setCaptchaError("");
  }

  async function handleResendWithCaptcha() {
    if (!captchaAnswer || captchaAnswer.length < 4) {
      setCaptchaError("请输入图形验证码");
      return;
    }

    setResendLoading(true);
    setCaptchaError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaId, captchaAnswer }),
      });

      if (res.ok) {
        setResendTimer(60);
        setShowCaptcha(false);
      } else {
        const data = await res.json();
        setCaptchaError(data.error || "重新发送失败");
      }
    } catch {
      setCaptchaError("网络错误");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1.5">
          验证码
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          autoComplete="one-time-code"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 图形验证码（重新发送时显示） */}
      {showCaptcha && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">请先输入图形验证码</p>
          <CaptchaInput
            onCaptchaReady={setCaptchaId}
            onAnswerChange={setCaptchaAnswer}
            error={captchaError}
          />
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleResendWithCaptcha}
              disabled={resendLoading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {resendLoading ? "发送中..." : "确认发送"}
            </button>
            <button
              type="button"
              onClick={() => setShowCaptcha(false)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "验证中..." : "验证"}
        </button>
        {!showCaptcha && (
          <button
            type="button"
            onClick={startResend}
            disabled={resendTimer > 0}
            className="w-full rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {resendTimer > 0 ? `重新发送 (${resendTimer}s)` : "重新发送验证码"}
          </button>
        )}
      </div>
    </form>
  );
}
