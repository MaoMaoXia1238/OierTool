/**
 * 图形验证码 API
 * GET /api/auth/captcha — 生成 SVG 图形验证码
 */
import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";

export async function GET() {
  const { captchaId, svg } = generateCaptcha();
  return NextResponse.json({ captchaId, svg });
}
