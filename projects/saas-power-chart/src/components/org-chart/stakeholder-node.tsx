"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ATTITUDE_COLORS, ROLE_LABELS, INFLUENCE_LABELS } from "@/lib/constants";
import type { Stakeholder, InfluenceLevel } from "@/types/stakeholder";
import { cn } from "@/lib/utils";

type StakeholderNodeData = Stakeholder & { label?: string };

function StakeholderNodeComponent({ data, selected }: NodeProps) {
  const s = data as unknown as StakeholderNodeData;
  const colors = ATTITUDE_COLORS[s.attitude];
  const influenceWidth = ((s.influenceLevel as number) / 5) * 100;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 hover:!bg-blue-500 hover:!w-4 hover:!h-4 !transition-all"
        isConnectable
      />
      <div
        className={cn(
          "bg-white rounded-lg shadow-sm border-2 p-3 w-[200px] cursor-pointer transition-shadow",
          colors.border,
          selected && "ring-2 ring-blue-500 shadow-md"
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{s.name}</p>
            <p className="text-xs text-muted-foreground truncate">{s.title}</p>
          </div>
          <span
            className={cn(
              "shrink-0 inline-block w-2.5 h-2.5 rounded-full mt-1",
              colors.bg,
              colors.border,
              "border"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground truncate mb-2">
          {s.department}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {ROLE_LABELS[s.roleInDeal]}
          </span>
          <span className="text-muted-foreground">
            影響力: {INFLUENCE_LABELS[s.influenceLevel as InfluenceLevel]}
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", colors.bg.replace("100", "400"))}
            style={{ width: `${influenceWidth}%` }}
          />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3 hover:!bg-blue-500 hover:!w-4 hover:!h-4 !transition-all"
        isConnectable
      />
    </>
  );
}

export const StakeholderNode = memo(StakeholderNodeComponent);
