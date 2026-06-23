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

    // 验证通过：读取暂存的注册数据，创建用户
    let pendingData: { password: string; name: string } | null = null;
    if (token.pendingData) {
      try {
        pendingData = JSON.parse(token.pendingData);
      } catch {
        // pendingData 格式异常，降级处理
      }
    }

    // 只有注册验证流程（有 pendingData）才创建用户
    // 登录验证码流程（无 pendingData）仅做 token 校验，不创建用户
    if (pendingData && pendingData.password) {
      await prisma.user.create({
        data: {
          email,
          password: pendingData.password,
          name: pendingData.name,
          emailVerified: new Date(),
        },
      });
    } else {
      // 邮箱已注册但尚未验证的场景：仅更新 emailVerified
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
    }

    // 删除已使用的 token
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
