"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[deal.id]
  );
  const count = stakeholders?.length ?? 0;
  const trashDeal = useDealStore((s) => s.trashDeal);

  const handleTrash = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trashDeal(deal.id);
    toast.success(`「${deal.name}」をゴミ箱に移動しました`);
  };

  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{deal.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{deal.clientName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleTrash}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                ゴミ箱に移動
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
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
          {deal.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {deal.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
