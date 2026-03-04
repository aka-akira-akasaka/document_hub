"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

export function TopBar() {
  const pathname = usePathname();

  // ログインページではトップバーを非表示
  if (pathname === "/login") return null;

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-5 shrink-0">
      {/* 左: ロゴ */}
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <span className="text-base">Power Chart</span>
      </Link>

      {/* 右: 設定 + プランバッジ + ユーザーアバター */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          設定
        </Link>

        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
          FREE
        </span>

        <UserMenu />
      </div>
    </header>
  );
}
