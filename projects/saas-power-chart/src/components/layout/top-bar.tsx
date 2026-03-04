"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, FileStack, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "@/components/auth/user-menu";
import { TemplateManagement } from "@/components/settings/template-management";
import { NodeSettings } from "@/components/settings/node-settings";

export function TopBar() {
  const pathname = usePathname();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // ログインページではトップバーを非表示
  if (pathname === "/login") return null;

  return (
    <>
      <header className="h-14 bg-white border-b flex items-center justify-between px-5 shrink-0">
        {/* 左: ロゴ */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="text-base">Power Chart</span>
        </Link>

        {/* 右: 設定 + プランバッジ + ユーザーアバター */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                <Settings className="h-3.5 w-3.5" />
                設定
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveDialog("templates")}>
                <FileStack className="h-4 w-4 mr-2" />
                テンプレート管理
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog("node-settings")}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                ノード設定
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            FREE
          </span>

          <UserMenu />
        </div>
      </header>

      {/* 設定ダイアログ */}
      <TemplateManagement
        open={activeDialog === "templates"}
        onOpenChange={(open) => { if (!open) setActiveDialog(null); }}
      />
      <NodeSettings
        open={activeDialog === "node-settings"}
        onOpenChange={(open) => { if (!open) setActiveDialog(null); }}
      />
    </>
  );
}
