"use client";

import { useDealStore } from "@/stores/deal-store";
import { DealCard } from "./deal-card";
import { DealCreateDialog } from "./deal-create-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { FolderOpen } from "lucide-react";

export function DealList() {
  const deals = useDealStore((s) => s.deals.filter((d) => !d.trashedAt));

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="案件がありません"
        description="新しい案件を作成して、パワーチャートの構築を始めましょう。"
        action={<DealCreateDialog />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
