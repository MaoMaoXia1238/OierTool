/**
 * 注册页面
 * 提供邮箱 + 密码 + 可选用户名的注册表单。
 * 已登录用户自动重定向到首页。
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">注册 OierTool</h1>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        已有账号？
        <a href="/auth/signin" className="text-primary hover:underline ml-1">
          立即登录
        </a>
      </p>
    </div>
  );
}
