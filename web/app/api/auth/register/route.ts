/**
 * 用户注册 API
 * POST /api/auth/register
 * Body: { email, password, name?, captchaId, captchaAnswer }
 * 校验图形验证码 → 查重 → 冷却检查 → 先发邮件 → 成功后创建用户。
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, generateCode } from "@/lib/email";
import { verifyCaptcha } from "@/lib/captcha";

// 注册输入验证 schema
const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少 8 个字符"),
  name: z.string().min(1, "请输入用户名").optional(),
  captchaId: z.string().min(1, "图形验证码ID不能为空"),
  captchaAnswer: z.string().length(4, "图形验证码为 4 位"),
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

    const { email, password, name, captchaId, captchaAnswer } = parsed.data;

    // ① 校验图形验证码
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return NextResponse.json(
        { error: "图形验证码错误或已过期" },
        { status: 400 }
      );
    }

    // ② 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // ③ 5 分钟冷却检查
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gt: new Date(Date.now() + 5 * 60 * 1000) },
      },
    });
    if (recentToken) {
      const waitSeconds = Math.ceil(
        (recentToken.expires.getTime() - Date.now() - 5 * 60 * 1000) / 1000
      );
      return NextResponse.json(
        { error: `请等待 ${waitSeconds} 秒后再试` },
        { status: 429 }
      );
    }

    // bcrypt 哈希密码（12 轮）
    const hashedPassword = await bcrypt.hash(password, 12);

    // ④ 生成验证码并发送邮件（先发邮件，成功后再暂存注册数据）
    const code = generateCode();
    const sent = await sendVerificationCode(email, code);
    if (!sent) {
      return NextResponse.json(
        { error: "验证码发送失败，请稍后再试" },
        { status: 500 }
      );
    }

    // 删除该邮箱旧的待验证记录
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 存入 VerificationToken（10 分钟有效），暂存注册数据
    // 用户不在此时创建，等邮箱验证通过后由 verify-email API 创建
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
        pendingData: JSON.stringify({
          password: hashedPassword,
          name: name ?? email.split("@")[0],
        }),
      },
    });

    return NextResponse.json(
      {
        message: "注册成功，请查收验证码邮件",
        email,
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
