/**
 * 发送验证码 API（供登录使用）
 * POST /api/auth/send-code
 * Body: { email: string }
 * 向指定邮箱发送 6 位验证码，用于验证码登录。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, generateCode } from "@/lib/email";

const sendCodeSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        { error: "该邮箱未注册" },
        { status: 404 }
      );
    }

    // 清除该邮箱旧的验证码
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 生成新验证码
    const code = generateCode();

    // 存入 VerificationToken（10 分钟有效）
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // 发送邮件
    const sent = await sendVerificationCode(email, code);
    if (!sent) {
      return NextResponse.json(
        { error: "验证码发送失败，请稍后再试" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "验证码已发送" },
      { status: 200 }
    );
  } catch (error) {
    console.error("发送验证码失败:", error);
    return NextResponse.json(
      { error: "发送失败，请稍后再试" },
      { status: 500 }
    );
  }
}
