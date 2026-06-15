/**
 * 个人信息编辑表单（客户端组件）
 * 支持查看模式 / 编辑模式切换，可修改用户名。
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("保存成功");
        setEditing(false);
        router.refresh();
      } else {
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 头像占位 */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name || "未设置用户名"}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* 提示 */}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 用户名字段 */}
      <div>
        <label className="block text-sm font-medium mb-1.5">用户名</label>
        {editing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(user.name || "");
                setError("");
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.name || "未设置"}</span>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-primary hover:underline"
            >
              编辑
            </button>
          </div>
        )}
      </div>

      {/* 邮箱（只读） */}
      <div>
        <label className="block text-sm font-medium mb-1.5">邮箱</label>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
