"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ATTITUDE_COLORS, ROLE_LABELS, INFLUENCE_LABELS } from "@/lib/constants";
import type { Stakeholder, InfluenceLevel } from "@/types/stakeholder";
import { cn } from "@/lib/utils";
import { Plus, HelpCircle, Pencil, Trash2 } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

type StakeholderNodeData = Stakeholder & { label?: string };

function StakeholderNodeComponent({ data, selected, id }: NodeProps) {
  const s = data as unknown as StakeholderNodeData;
  const colors = ATTITUDE_COLORS[s.attitude];
  const influenceWidth = ((s.influenceLevel as number) / 5) * 100;
  const isUnknown = s.isUnknown;
  const openAddPopover = useUiStore((st) => st.openAddPopover);
  const openSheet = useUiStore((st) => st.openSheet);

  const handleAddAbove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openAddPopover(
        { type: "node", nodeId: id, position: "above" },
        { x: e.clientX, y: e.clientY }
      );
    },
    [id, openAddPopover]
  );

  const handleAddBelow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openAddPopover(
        { type: "node", nodeId: id, position: "below" },
        { x: e.clientX, y: e.clientY }
      );
    },
    [id, openAddPopover]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openSheet(id, "edit");
    },
    [id, openSheet]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openSheet(id, "view");
    },
    [id, openSheet]
  );

  return (
    <>
      {/* 上方向追加ボタン */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <button
          className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10"
          onClick={handleAddAbove}
          title="上司を追加"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 hover:!bg-blue-500 hover:!w-4 hover:!h-4 !transition-all"
        isConnectable
      />

      <div
        className={cn(
          "rounded-lg shadow-sm border-2 p-3 w-[200px] cursor-pointer transition-shadow group",
          isUnknown
            ? "bg-gray-50 border-dashed border-orange-300"
            : cn("bg-white", colors.border),
          selected && "ring-2 ring-blue-500 shadow-md"
        )}
      >
        {/* 編集・削除ボタン（ホバー表示） */}
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-5 h-5 rounded bg-white/80 border border-gray-200 flex items-center justify-center hover:bg-blue-50"
            onClick={handleEdit}
            title="編集"
          >
            <Pencil className="w-3 h-3 text-gray-500" />
          </button>
          <button
            className="w-5 h-5 rounded bg-white/80 border border-gray-200 flex items-center justify-center hover:bg-red-50"
            onClick={handleDelete}
            title="詳細/削除"
          >
            <Trash2 className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            {isUnknown ? (
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <p className="font-semibold text-sm truncate text-orange-600">
                  {s.name || "不明"}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-sm truncate">{s.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">{s.title}</p>
          </div>
          <span
            className={cn(
              "shrink-0 inline-block w-2.5 h-2.5 rounded-full mt-1",
              isUnknown ? "bg-orange-200 border-orange-400" : cn(colors.bg, colors.border),
              "border"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {s.department}
        </p>
        {s.mission && (
          <p className="text-xs text-blue-600 truncate mb-1">{s.mission}</p>
        )}
        {!s.mission && <div className="mb-1" />}
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
            className={cn(
              "h-full rounded-full",
              isUnknown ? "bg-orange-300" : colors.bg.replace("100", "400")
            )}
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
      {/* 下方向追加ボタン */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <button
          className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10"
          onClick={handleAddBelow}
          title="部下を追加"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}

export const StakeholderNode = memo(StakeholderNodeComponent);
