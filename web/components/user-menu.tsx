/**
 * 用户菜单组件（客户端组件）
 * 显示当前登录用户名和退出按钮的下拉菜单。
 * 使用简易实现，不依赖 shadcn/ui DropdownMenu。
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

interface UserMenuProps {
  session: Session;
}

export default function UserMenu({ session }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const user = session.user;
  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
          {(user.name || user.email || "U").charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate">
          {user.name || user.email}
        </span>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-popover p-1 shadow-lg z-50">
          <div className="px-3 py-2 text-sm text-muted-foreground border-b mb-1 truncate">
            {user.email}
          </div>
          <a
            href="/profile"
            className="block rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
          >
            个人中心
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
