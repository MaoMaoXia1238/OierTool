/**
 * 登录表单组件（客户端组件）
 * 提供 Tab 切换「密码登录」和「验证码登录」两种方式。
 * 含前端校验、加载状态和错误提示。
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import CaptchaInput from "@/components/CaptchaInput";

type LoginTab = "password" | "code";

export default function SignInForm() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("password");

  // 密码登录状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 验证码登录状态
  const [codeEmail, setCodeEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeTimer, setCodeTimer] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 发送验证码倒计时
  useEffect(() => {
    if (codeTimer <= 0) return;
    const timer = setInterval(() => setCodeTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [codeTimer]);

  // 切换 Tab 时清除错误
  function switchTab(t: LoginTab) {
    setTab(t);
    setError("");
  }

  // 密码登录
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        loginType: "password",
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("登录失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  // 发送验证码
  async function handleSendCode() {
    if (!codeEmail || codeTimer > 0) return;
    if (!captchaAnswer || captchaAnswer.length < 4) {
      setError("请输入图形验证码");
      return;
    }
    setSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: codeEmail, captchaId, captchaAnswer }),
      });

      if (res.ok) {
        setCodeTimer(60);
      } else {
        const data = await res.json();
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSendingCode(false);
    }
  }

  // 验证码登录
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!codeEmail || !code) {
      setError("请填写邮箱和验证码");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: codeEmail,
        code,
        loginType: "code",
        redirect: false,
      });

      if (result?.error) {
        setError("验证码错误或已过期");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("登录失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => switchTab("password")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
            tab === "password"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          密码登录
        </button>
        <button
          onClick={() => switchTab("code")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
            tab === "code"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          验证码登录
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* 密码登录表单 */}
      {tab === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      )}

      {/* 验证码登录表单 */}
      {tab === "code" && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <label htmlFor="code-email" className="block text-sm font-medium mb-1.5">
              邮箱
            </label>
            <input
              id="code-email"
              type="email"
              value={codeEmail}
              onChange={(e) => setCodeEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>

          {/* 图形验证码（移到验证码上方） */}
          <CaptchaInput
            onCaptchaReady={setCaptchaId}
            onAnswerChange={setCaptchaAnswer}
          />

          <div>
            <label htmlFor="login-code" className="block text-sm font-medium mb-1.5">
              邮箱验证码
            </label>
            <div className="flex gap-2">
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center text-sm font-mono tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={codeTimer > 0 || sendingCode}
                className="shrink-0 rounded-lg border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-50"
              >
                {sendingCode
                  ? "发送中..."
                  : codeTimer > 0
                    ? `${codeTimer}s`
                    : "获取验证码"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      )}
    </div>
  );
}
