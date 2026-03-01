"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// ナビゲーションアイテム定義
const navItems = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "設定", href: "/settings", icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-white border-r flex flex-col">
      {/* ロゴ */}
      <div className="h-14 flex items-center px-5 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="text-base">Power Chart</span>
        </Link>
      </div>

      {/* ナビゲーションリンク */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          // ホームは完全一致、それ以外はprefixマッチ
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
