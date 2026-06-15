/**
 * 个人中心页面（服务端组件）
 * 需登录才能访问，展示用户信息并提供编辑功能。
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  // 从数据库获取最新用户信息
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, emailVerified: true, role: true, createdAt: true },
  });

  if (!user) redirect("/auth/signin");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">个人中心</h1>

      <div className="rounded-lg border bg-card p-6 space-y-6">
        <ProfileForm user={{ name: user.name, email: user.email }} />

        {/* 账号信息 */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-3">账号信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">邮箱验证</span>
              <span className={user.emailVerified ? "text-green-600" : "text-yellow-600"}>
                {user.emailVerified ? "已验证" : "未验证"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">角色</span>
              <span>{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">注册时间</span>
              <span>{new Date(user.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
