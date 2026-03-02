"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { OrgGroup } from "@/types/org-group";
import { ORG_GROUP_LEVEL_LABELS, ORG_GROUP_LEVEL_COLORS } from "@/types/org-group";

function OrgGroupNodeComponent({ data }: NodeProps) {
  const group = data as unknown as OrgGroup;
  const colors = ORG_GROUP_LEVEL_COLORS[group.level];
  const levelLabel = ORG_GROUP_LEVEL_LABELS[group.level];

  return (
    <div
      className="rounded-lg border-2 border-dashed"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        className="org-group-drag-handle flex items-center gap-2 px-3 py-1.5 rounded-t-md cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: colors.header }}
      >
        <span className="font-semibold text-sm text-foreground truncate">
          {group.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground flex-shrink-0">
          {levelLabel}
        </span>
      </div>
    </div>
  );
}

export const OrgGroupNode = memo(OrgGroupNodeComponent);
