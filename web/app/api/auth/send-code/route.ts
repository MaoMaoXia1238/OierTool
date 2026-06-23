/**
 * 发送验证码 API（供登录使用）
 * POST /api/auth/send-code
 * Body: { email: string, captchaId: string, captchaAnswer: string }
 * 先校验图形验证码 → 检查5分钟冷却 → 发送邮箱验证码。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, generateCode } from "@/lib/email";
import { verifyCaptcha } from "@/lib/captcha";

const sendCodeSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  captchaId: z.string().min(1, "图形验证码ID不能为空"),
  captchaAnswer: z.string().length(4, "图形验证码为 4 位"),
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

    const { email, captchaId, captchaAnswer } = parsed.data;

    // ① 校验图形验证码
    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      return NextResponse.json(
        { error: "图形验证码错误或已过期" },
        { status: 400 }
      );
    }

    // 检查用户是否存在（用于区分登录验证码 vs 注册重发）
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 获取该邮箱已有的 VerificationToken（可能包含待注册数据）
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    // 用户不存在且无待验证记录 → 拒绝
    if (!user && !existingToken) {
      return NextResponse.json(
        { error: "该邮箱未注册" },
        { status: 404 }
      );
    }

    // ② 5 分钟冷却检查
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

    // 清除该邮箱旧的验证码
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 生成新验证码
    const code = generateCode();

    // 存入 VerificationToken（10 分钟有效）
    // 如果是注册重发，保留 pendingData
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
        pendingData: existingToken?.pendingData ?? null,
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
