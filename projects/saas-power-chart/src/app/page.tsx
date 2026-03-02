"use client";

import { DealList } from "@/components/deals/deal-list";
import { DealCreateDialog } from "@/components/deals/deal-create-dialog";
import { useDealStore } from "@/stores/deal-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const deals = useDealStore((s) => s.deals);

  // Zustand persist のハイドレーション完了まで何も描画しない
  // （SSRとクライアントの状態不一致 → React #418/#185 を防止）
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
