"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS } from "@/lib/constants";
import type { Deal } from "@/types/deal";
import { ArrowLeft, Download, Upload, Users } from "lucide-react";

interface DealHeaderProps {
  deal: Deal;
  onBatchAddClick: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
}

export function DealHeader({
  deal,
  onBatchAddClick,
  onImportClick,
  onExportClick,
}: DealHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{deal.name}</h1>
            <Badge
              variant="secondary"
              className={DEAL_STAGE_COLORS[deal.stage]}
            >
              {DEAL_STAGE_LABELS[deal.stage]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{deal.clientName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBatchAddClick}>
          <Users className="h-4 w-4 mr-1" />
          一括追加
        </Button>
        <Button variant="outline" size="sm" onClick={onImportClick}>
          <Upload className="h-4 w-4 mr-1" />
          CSVインポート
        </Button>
        <Button variant="outline" size="sm" onClick={onExportClick}>
          <Download className="h-4 w-4 mr-1" />
          CSVエクスポート
        </Button>
      </div>
    </div>
  );
}
