"use client";

import { useMemo } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { DealList } from "@/components/deals/deal-list";
import { DealCreateDialog } from "@/components/deals/deal-create-dialog";
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">案件一覧</h1>
              <p className="text-sm text-muted-foreground mt-1">読み込み中...</p>
            </div>
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

  return (
    <div className="flex-1 bg-gray-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">案件一覧</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {deals.length}件の案件
            </p>
          </div>
          {deals.length > 0 && <DealCreateDialog />}
        </div>
        <DealList />
      </main>
    </div>
  );
}
