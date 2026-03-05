"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS } from "@/lib/constants";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useDealStore } from "@/stores/deal-store";
import type { Deal } from "@/types/deal";
import { MoreVertical, Trash2, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  view?: "grid" | "list";
}

export function DealCard({ deal, view = "grid" }: DealCardProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[deal.id]
  );
  const count = stakeholders?.length ?? 0;
  const trashDeal = useDealStore((s) => s.trashDeal);
  const isShared = !!deal.shareRole;

  const handleTrash = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trashDeal(deal.id);
    toast.success(`「${deal.name}」をゴミ箱に移動しました`);
  };

  const formattedDate = new Date(deal.updatedAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  if (view === "list") {
    return (
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:shadow-sm hover:border-gray-300 transition-all">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0">
            <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{deal.name}</p>
            <p className="text-xs text-muted-foreground truncate">{deal.clientName}</p>
          </div>
          <Badge variant="secondary" className={cn("shrink-0 text-[10px]", DEAL_STAGE_COLORS[deal.stage])}>
            {DEAL_STAGE_LABELS[deal.stage]}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Users className="h-3 w-3" />
            <span>{count}</span>
          </div>
          {!deal.shareRole && (
            <Badge className="shrink-0 text-[10px] bg-gray-100 text-gray-500 hover:bg-gray-100">
              自分が作成
            </Badge>
          )}
          {deal.shareRole === "editor" && (
            <Badge className="shrink-0 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
              編集可
            </Badge>
          )}
          {deal.shareRole === "viewer" && (
            <Badge className="shrink-0 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
              閲覧のみ
            </Badge>
          )}
          <span className="text-xs text-muted-foreground shrink-0">{formattedDate}</span>
          {!isShared && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600" onClick={handleTrash}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  ゴミ箱に移動
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/deals/${deal.id}`} className="block">
      <div className="h-[180px] rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col p-5">
        {/* 上段: アイコン + メニュー */}
        <div className="flex items-start justify-between mb-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          {deal.shareRole === "editor" ? (
            <Badge className="text-[10px] -mr-1 -mt-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              編集可
            </Badge>
          ) : deal.shareRole === "viewer" ? (
            <Badge className="text-[10px] -mr-1 -mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
              閲覧のみ
            </Badge>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600" onClick={handleTrash}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  ゴミ箱に移動
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 下段: タイトル + メタ情報 */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {deal.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {count}人
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
