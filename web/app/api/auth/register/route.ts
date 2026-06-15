/**
 * 用户注册 API
 * POST /api/auth/register
 * Body: { email: string, password: string, name?: string }
 * 创建用户（未验证状态）并发送邮箱验证码。
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, generateCode } from "@/lib/email";

// 注册输入验证 schema
const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少 8 个字符"),
  name: z.string().min(1, "请输入用户名").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // zod 校验输入
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // bcrypt 哈希密码（12 轮）
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户（emailVerified 为 null，表示未验证）
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ?? email.split("@")[0],
      },
    });

    // 生成 6 位数字验证码
    const code = generateCode();

    // 存入 VerificationToken 表（10 分钟有效）
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // 发送验证码邮件
    await sendVerificationCode(email, code);

    return NextResponse.json(
      {
        message: "注册成功，请查收验证码邮件",
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}
