/**
 * 代码执行 API 路由
 * POST /api/execute —— 代理转发到 Judge0 兼容的执行引擎。
 *
 * 请求体：{ language, sourceCode, stdin? }
 * 响应：  { status, stdout, stderr, compileOutput, time, memory }
 *
 * 上游地址由环境变量 JUDGE0_API_URL 决定（默认 Judge0 公共端点）。
 * 后续自托管 Judge0 后仅需修改环境变量，代码零改动。
 * 校验遵循白名单风格：语言白名单、源码/stdin 长度上限、按 IP 简单限流。
 */

import { NextResponse } from "next/server";

/** Vercel 函数最大执行时长（秒），覆盖编译+运行的等待时间 */
export const maxDuration = 60;

/** Judge0 上游地址（自托管后改为内网地址即可） */
const JUDGE0_API_URL = process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";

/** 语言白名单 → Judge0 language_id（54=C++ GCC, 71=Python 3, 62=Java OpenJDK） */
const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,
  python: 71,
  java: 62,
};

/** 长度上限（字符数） */
const MAX_SOURCE_LENGTH = 64 * 1024;
const MAX_STDIN_LENGTH = 8 * 1024;

/** 执行资源限制 */
const CPU_TIME_LIMIT = 5; // 秒
const WALL_TIME_LIMIT = 10; // 秒
const MEMORY_LIMIT = 256000; // KB

/** 上游请求超时（毫秒） */
const UPSTREAM_TIMEOUT = 30_000;

/** 限流窗口与额度 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

/**
 * 内存型按 IP 限流（实例内有效）。
 * 注意：serverless 多实例不共享状态，此为尽力而为的防误触措施。
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/** base64 解码（Judge0 base64_encoded 响应字段），失败时返回 null */
function decode(value: string | null | undefined): string | null {
  if (value == null) return null;
  try {
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * 处理 POST /api/execute 请求
 * @param request - 标准 Web Request 对象
 * @returns JSON 响应，包含执行结果或错误信息
 */
export async function POST(request: Request) {
  try {
    // 按 IP 简单限流
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    // 解析并校验请求体
    let body: { language?: unknown; sourceCode?: unknown; stdin?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
    }

    const { language, sourceCode, stdin } = body;
    if (typeof language !== "string" || !(language in LANGUAGE_IDS)) {
      return NextResponse.json(
        { error: `不支持的语言: ${String(language)}（可选值: cpp, python, java）` },
        { status: 400 }
      );
    }
    if (typeof sourceCode !== "string" || sourceCode.trim() === "") {
      return NextResponse.json({ error: "源代码不能为空" }, { status: 400 });
    }
    if (sourceCode.length > MAX_SOURCE_LENGTH) {
      return NextResponse.json(
        { error: `源代码长度超限（最大 ${MAX_SOURCE_LENGTH / 1024}KB）` },
        { status: 400 }
      );
    }
    const stdinText = typeof stdin === "string" ? stdin : "";
    if (stdinText.length > MAX_STDIN_LENGTH) {
      return NextResponse.json(
        { error: `输入长度超限（最大 ${MAX_STDIN_LENGTH / 1024}KB）` },
        { status: 400 }
      );
    }

    // 调用 Judge0 上游（base64 传输避免转义问题，wait=true 同步等待结果）
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);
    let upstream: Response;
    try {
      upstream = await fetch(
        `${JUDGE0_API_URL}/submissions?wait=true&base64_encoded=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language_id: LANGUAGE_IDS[language],
            source_code: Buffer.from(sourceCode, "utf-8").toString("base64"),
            stdin: Buffer.from(stdinText, "utf-8").toString("base64"),
            cpu_time_limit: CPU_TIME_LIMIT,
            wall_time_limit: WALL_TIME_LIMIT,
            memory_limit: MEMORY_LIMIT,
          }),
          signal: controller.signal,
          cache: "no-store",
        }
      );
    } catch {
      return NextResponse.json(
        { error: "执行服务繁忙或超时，请稍后重试" },
        { status: 502 }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `执行服务异常（HTTP ${upstream.status}），请稍后重试` },
        { status: 502 }
      );
    }

    const result = await upstream.json();
    return NextResponse.json({
      status: result.status ?? { id: 0, description: "Unknown" },
      stdout: decode(result.stdout),
      stderr: decode(result.stderr),
      compileOutput: decode(result.compile_output),
      time: result.time ?? null,
      memory: result.memory ?? null,
    });
  } catch (error) {
    console.error("[/api/execute] 未预期的错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
