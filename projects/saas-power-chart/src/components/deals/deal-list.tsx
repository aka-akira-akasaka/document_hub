"use client";

import { useMemo, useState } from "react";
import { useDealStore } from "@/stores/deal-store";
import { DealCard } from "./deal-card";
import { DealCreateDialog } from "./deal-create-dialog";
import { Plus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export function DealList() {
  const allDeals = useDealStore((s) => s.deals);
  const deals = useMemo(
    () => allDeals
      .filter((d) => !d.trashedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [allDeals]
  );
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <div>
      {/* ビュー切替トグル */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center h-8 w-8 transition-colors",
              view === "grid"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            onClick={() => setView("grid")}
            title="グリッド表示"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center h-8 w-8 transition-colors",
              view === "list"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            onClick={() => setView("list")}
            title="リスト表示"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* 新規作成カード（常に先頭） */}
          <DealCreateCard />
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} view="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* リスト表示: 新規作成は別途ボタンで */}
          <DealCreateCard view="list" />
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} view="list" />
          ))}
        </div>
      )}
    </div>
  );
}

/** 新規案件作成カード（NotebookLMの「新規作成」カードを模倣） */
function DealCreateCard({ view = "grid" }: { view?: ViewMode }) {
  if (view === "list") {
    return (
      <DealCreateDialog
        trigger={
          <button
            type="button"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shrink-0">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">新規案件を作成</span>
          </button>
        }
      />
    );
  }

  return (
    <DealCreateDialog
      trigger={
        <button
          type="button"
          className="h-[180px] rounded-xl border border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">新規案件を作成</span>
        </button>
      }
    />
  );
}
