"use client";

import { memo, useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import type { OrgGroup } from "@/types/org-group";
import { MoreVertical, Plus } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

function OrgGroupNodeComponent({ data, id }: NodeProps) {
  const group = data as unknown as OrgGroup;
  const openAddPopover = useUiStore((st) => st.openAddPopover);

  const handleAddPerson = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // グループIDをコンテキストとして渡して追加メニューを開く
      openAddPopover(
        { type: "node", nodeId: id, position: "below" },
        { x: e.clientX, y: e.clientY }
      );
    },
    [id, openAddPopover]
  );

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white/95 shadow-sm"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div className="org-group-drag-handle flex items-center justify-between px-3 py-2 border-b border-gray-100 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm text-gray-800 truncate">
            {group.name}
          </span>
          <span className="text-gray-400 text-sm">:</span>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* フッター: ＋人を追加する */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5">
        <button
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
          onClick={handleAddPerson}
        >
          <Plus className="w-3 h-3" />
          <span>人を追加する</span>
        </button>
      </div>
    </div>
  );
}

export const OrgGroupNode = memo(OrgGroupNodeComponent);
