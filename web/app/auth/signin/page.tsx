/**
 * 登录页面
 * 使用 Auth.js v5 的 signIn 函数处理凭据登录。
 * 已登录用户自动重定向到首页。
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">登录 OierTool</h1>
      <SignInForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        还没有账号？
        <a href="/auth/register" className="text-primary hover:underline ml-1">
          立即注册
        </a>
      </p>
    </div>
  );
}
