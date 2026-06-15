/**
 * 邮箱验证表单组件（客户端组件）
 * 提供 6 位验证码输入、提交验证和重新发送功能。
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

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

  async function handleResend() {
    setResendLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendTimer(60);
      } else {
        const data = await res.json();
        setError(data.error || "重新发送失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 验证码输入 */}
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

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 提交 + 重新发送 */}
      <div className="space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "验证中..." : "验证"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendTimer > 0 || resendLoading}
          className="w-full rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {resendLoading
            ? "发送中..."
            : resendTimer > 0
              ? `重新发送 (${resendTimer}s)`
              : "重新发送验证码"}
        </button>
      </div>
    </form>
  );
}
