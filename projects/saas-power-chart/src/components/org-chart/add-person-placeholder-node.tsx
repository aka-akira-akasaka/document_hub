"use client";

import { memo, useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

interface PlaceholderData {
  groupId: string;
}

function AddPersonPlaceholderNodeComponent({ data }: NodeProps) {
  const { groupId } = data as unknown as PlaceholderData;
  const openAddPopover = useUiStore((st) => st.openAddPopover);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openAddPopover(
        { type: "group", groupId },
        { x: e.clientX, y: e.clientY }
      );
    },
    [groupId, openAddPopover]
  );

  return (
    <button
      className="add-person-placeholder w-[180px] h-[32px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer"
      onClick={handleClick}
    >
      <Plus className="w-3.5 h-3.5" />
      <span>人を追加する</span>
    </button>
  );
}

export const AddPersonPlaceholderNode = memo(AddPersonPlaceholderNodeComponent);
