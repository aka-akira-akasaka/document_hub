"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { DealList } from "@/components/deals/deal-list";
import { Button } from "@/components/ui/button";
import { useDealStore } from "@/stores/deal-store";

/**
 * Hydrationガードラッパー
 * Zustand persist の hydration 完了までストア依存UIをマウントしない。
 * useSyncExternalStore と SSR の状態不一致 (React #185) を防止。
 */
export default function DashboardPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold">最近の案件</h1>
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

  return (
    <div className="flex-1 bg-gray-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">最近の案件</h1>
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

        {/* 案件一覧（新規作成カード含む） */}
        <DealList />
      </main>
    </div>
  );
}
