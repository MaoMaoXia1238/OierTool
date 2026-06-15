/**
 * 用户信息更新 API
 * PUT /api/user/profile
 * Body: { name?: string }
 * 更新当前登录用户的个人信息。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1, "用户名不能为空").optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 更新用户信息
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: parsed.data.name,
      },
      select: {
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      { message: "更新成功", user: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("更新失败:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后再试" },
      { status: 500 }
    );
  }
}
