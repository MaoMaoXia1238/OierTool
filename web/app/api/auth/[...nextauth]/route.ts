/**
 * Auth.js v5 API 路由处理器
 * 处理 /api/auth/signin, /api/auth/signout, /api/auth/callback, /api/auth/session 等请求。
 * Auth.js v5 会自动生成所有认证相关的 API 端点。
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
