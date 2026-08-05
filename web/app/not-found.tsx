/**
 * 404 页面（未找到）
 * 访问不存在的路由时展示友好提示。
 */
import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Home className="h-4 w-4" />
        返回首页
      </Link>
    </div>
  );
}
