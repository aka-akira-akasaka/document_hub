"use client";

import { useMemo } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDealStore } from "@/stores/deal-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS } from "@/lib/constants";
import { EmptyState } from "@/components/layout/empty-state";
import { Trash2, RotateCcw, Trash, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Deal } from "@/types/deal";

export default function TrashPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Trash2 className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-bold">ゴミ箱</h1>
          </div>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </main>
      </div>
    );
  }

  return <TrashContent />;
}

function TrashContent() {
  const allDeals = useDealStore((s) => s.deals);
  const trashedDeals = useMemo(() => allDeals.filter((d) => !!d.trashedAt), [allDeals]);

  return (
    <div className="flex-1 bg-gray-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Trash2 className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-bold">ゴミ箱</h1>
          <span className="text-sm text-muted-foreground ml-2">
            {trashedDeals.length}件
          </span>
        </div>

        {trashedDeals.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="ゴミ箱は空です"
            description="削除した案件はここに表示されます。"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trashedDeals.map((deal) => (
              <TrashedDealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TrashedDealCard({ deal }: { deal: Deal }) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[deal.id]
  );
  const count = stakeholders?.length ?? 0;
  const restoreDeal = useDealStore((s) => s.restoreDeal);
  const permanentlyDeleteDeal = useDealStore((s) => s.permanentlyDeleteDeal);
  const clearDealData = useStakeholderStore((s) => s.clearDealData);
  const clearGroupData = useOrgGroupStore((s) => s.clearDealData);

  const handleRestore = () => {
    restoreDeal(deal.id);
    toast.success(`「${deal.name}」を復元しました`);
  };

  const handlePermanentDelete = () => {
    clearDealData(deal.id);
    clearGroupData(deal.id);
    permanentlyDeleteDeal(deal.id);
    toast.success(`「${deal.name}」を完全に削除しました`);
  };

  const trashedDate = deal.trashedAt
    ? new Date(deal.trashedAt).toLocaleDateString("ja-JP")
    : "";

  return (
    <Card className="opacity-75 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{deal.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{deal.clientName}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="secondary"
            className={DEAL_STAGE_COLORS[deal.stage]}
          >
            {DEAL_STAGE_LABELS[deal.stage]}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{count}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {trashedDate} に削除
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleRestore}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            復元
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handlePermanentDelete}
          >
            <Trash className="h-3.5 w-3.5 mr-1.5" />
            完全削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
