"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AttitudeBadge } from "./attitude-badge";
import {
  ROLE_LABELS,
  INFLUENCE_LABELS,
} from "@/lib/constants";
import type { Stakeholder, InfluenceLevel } from "@/types/stakeholder";
import { Mail, Phone, Pencil, Trash2 } from "lucide-react";

interface StakeholderDetailProps {
  stakeholder: Stakeholder;
  onEdit: () => void;
  onDelete: () => void;
}

export function StakeholderDetail({
  stakeholder: s,
  onEdit,
  onDelete,
}: StakeholderDetailProps) {
  return (
    <div className="space-y-4 p-1">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{s.name}</h3>
          <p className="text-sm text-muted-foreground">{s.title}</p>
          <p className="text-sm text-muted-foreground">{s.department}</p>
        </div>
        <AttitudeBadge attitude={s.attitude} />
      </div>

      <Separator />

      <div className="space-y-3">
        <DetailRow label="案件での役割" value={ROLE_LABELS[s.roleInDeal]} />
        <DetailRow
          label="影響力"
          value={`${INFLUENCE_LABELS[s.influenceLevel as InfluenceLevel]} (${s.influenceLevel}/5)`}
        />
        <DetailRow label="関係構築担当" value={s.relationshipOwner || "未設定"} />
      </div>

      <Separator />

      <div className="space-y-2">
        {s.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{s.email}</span>
          </div>
        )}
        {s.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{s.phone}</span>
          </div>
        )}
      </div>

      {s.notes && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              メモ
            </p>
            <p className="text-sm whitespace-pre-wrap">{s.notes}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          削除
        </Button>
        <Button size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          編集
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
