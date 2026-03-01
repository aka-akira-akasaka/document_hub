"use client";

import { DealList } from "@/components/deals/deal-list";
import { DealCreateDialog } from "@/components/deals/deal-create-dialog";
import { MockDataSeeder } from "@/components/mock-data-seeder";
import { useDealStore } from "@/stores/deal-store";

export default function DashboardPage() {
  const deals = useDealStore((s) => s.deals);

  return (
    <div className="flex-1 bg-gray-50">
      <MockDataSeeder />
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
