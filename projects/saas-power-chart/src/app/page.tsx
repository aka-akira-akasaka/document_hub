"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { DealList } from "@/components/deals/deal-list";
import { Button } from "@/components/ui/button";
import { useDealStore } from "@/stores/deal-store";
import { cn } from "@/lib/utils";

export type DealFilter = "all" | "owned" | "shared";

const FILTER_TABS: { value: DealFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "owned", label: "自分が作成" },
  { value: "shared", label: "共有案件" },
];

/**
 * Hydrationガードラッパー
 * Zustand persist の hydration 完了までストア依存UIをマウントしない。
 */
export default function DashboardPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-5">
            <h1 className="text-xl font-bold">組織図一覧</h1>
          </div>
          {/* ローディング表示 */}
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">案件を読み込んでいます...</p>
          </div>
        </main>
      </div>
    );
  }

  return <DashboardContent />;
}

/** Zustand ストア依存の実コンテンツ（Hydration完了後にのみマウントされる） */
function DashboardContent() {
  const allDeals = useDealStore((s) => s.deals);
  const deals = useMemo(() => allDeals.filter((d) => !d.trashedAt), [allDeals]);
  const trashedCount = allDeals.length - deals.length;
  const [filter, setFilter] = useState<DealFilter>("all");

  return (
    <div className="flex-1 bg-gray-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">組織図一覧</h1>
          {trashedCount > 0 && (
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-700">
              <Link href="/trash">
                <Trash2 className="h-4 w-4 mr-1.5" />
                ゴミ箱
                <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 leading-none">
                  {trashedCount}
                </span>
              </Link>
            </Button>
          )}
        </div>

        {/* フィルタータブ */}
        <div className="flex items-center gap-1 mb-5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cn(
                "px-4 py-1.5 text-sm rounded-full transition-colors",
                filter === tab.value
                  ? "bg-gray-200 font-medium text-gray-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 案件一覧（新規作成カード含む） */}
        <DealList filter={filter} />
      </main>
    </div>
  );
}
