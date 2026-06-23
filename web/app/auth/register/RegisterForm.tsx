/**
 * 注册表单组件（客户端组件）
 * 提供邮箱 + 密码 + 用户名 + 图形验证码注册表单，调用 /api/auth/register API。
 * 含前端校验、加载状态和错误提示。
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaptchaInput from "@/components/CaptchaInput";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // 前端基础校验
    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 个字符");
      return;
    }
    if (!captchaAnswer || captchaAnswer.length < 4) {
      setError("请输入图形验证码");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          captchaId,
          captchaAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
      } else {
        router.push("/auth/verify?email=" + encodeURIComponent(email));
      }
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          用户名 <span className="text-muted-foreground text-xs">（可选）</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="给自己起个名字"
          autoComplete="name"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

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
          placeholder="至少 8 个字符"
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {/* 图形验证码 */}
      <CaptchaInput
        onCaptchaReady={setCaptchaId}
        onAnswerChange={setCaptchaAnswer}
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "注册中..." : "注册"}
      </button>
    </form>
  );
}
