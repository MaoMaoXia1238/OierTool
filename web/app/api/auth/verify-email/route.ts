/**
 * 邮箱验证码校验 API
 * POST /api/auth/verify-email
 * Body: { email: string, code: string }
 * 验证用户邮箱并激活账号。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "验证码必须为 6 位"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    // 查找验证记录
    const token = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "验证码错误" },
        { status: 400 }
      );
    }

    // 检查是否过期
    if (token.expires < new Date()) {
      // 删除过期 token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: code,
          },
        },
      });
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }

    // 验证通过：更新用户 emailVerified，删除 token
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    return NextResponse.json({ message: "邮箱验证成功" }, { status: 200 });
  } catch (error) {
    console.error("验证失败:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后再试" },
      { status: 500 }
    );
  }
}
