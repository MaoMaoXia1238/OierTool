/**
 * 邮箱验证页面
 * 显示验证码输入框，用户输入注册时收到的验证码完成邮箱验证。
 * 支持重新发送验证码（60 秒倒计时）。
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import VerifyForm from "./VerifyForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { email } = await searchParams;
  if (!email) redirect("/auth/register");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-4">验证邮箱</h1>
      <p className="text-center text-sm text-muted-foreground mb-8">
        验证码已发送到 <span className="font-medium text-foreground">{email}</span>，请查收邮件并输入 6 位验证码
      </p>
      <VerifyForm email={email} />
    </div>
  );
}
