/**
 * Next.js 16 代理层（替代 middleware.ts）
 * 使用 Auth.js v5 的 auth() 函数进行路由保护。
 * 当前阶段不强制登录，仅将用户信息注入请求上下文供页面使用。
 */
import { auth } from "@/auth";

export default auth(() => {
  // 当前所有页面公开访问，用户信息通过 auth() 在各页面自行获取
  // 后续需要保护的路由可在此添加逻辑
});

// 匹配所有路由（排除静态资源和 API 路由）
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
