"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { OrgGroup } from "@/types/org-group";
import { MoreVertical, FolderPlus, Plus, Pencil, Trash2 } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function OrgGroupNodeComponent({ data }: NodeProps) {
  const group = data as unknown as OrgGroup;
  const openGroupFormForChild = useUiStore((st) => st.openGroupFormForChild);
  const openGroupFormForEdit = useUiStore((st) => st.openGroupFormForEdit);
  const deleteGroup = useOrgGroupStore((st) => st.deleteGroup);
  const dragOverGroupId = useUiStore((st) => st.dragOverGroupId);
  const [hovered, setHovered] = useState(false);

  const isDropTarget = dragOverGroupId === group.id;
  const isTieredGroup = (group.tier ?? 0) > 0;

  const handleAddSubGroup = useCallback(
    (e: React.MouseEvent | Event) => {
      e.stopPropagation();
      openGroupFormForChild(group.id);
    },
    [group.id, openGroupFormForChild]
  );

  const handleEdit = useCallback(
    (e: Event) => {
      e.stopPropagation();
      openGroupFormForEdit(group.id);
    },
    [group.id, openGroupFormForEdit]
  );

  const handleDelete = useCallback(
    (e: Event) => {
      e.stopPropagation();
      deleteGroup(group.id, group.dealId);
      toast.success(`${group.name} を削除しました`);
    },
    [group.id, group.dealId, group.name, deleteGroup]
  );

  const groupHandleClass = hovered
    ? "!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-blue-600 !rounded-full transition-all !overflow-visible before:content-[''] before:absolute before:-inset-3 before:rounded-full"
    : "!w-4 !h-4 !bg-transparent !border-0 !pointer-events-none transition-all";

  return (
    <div
      className={`rounded-lg border shadow-sm transition-all duration-200 ${
        isDropTarget
          ? "border-blue-400 bg-blue-50/80 shadow-md ring-2 ring-blue-200"
          : isTieredGroup
            ? "border-dashed border-purple-300 bg-purple-50/60"
            : "border-gray-200 bg-white/95"
      }`}
      style={{
        width: "100%",
        height: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* コネクタの受け口（target: 4辺） */}
      <Handle
        type="target"
        position={Position.Top}
        id="group-top"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="group-bottom"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="target"
        position={Position.Left}
        id="group-left"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="target"
        position={Position.Right}
        id="group-right"
        className={groupHandleClass}
        isConnectable
      />

      {/* コネクタの出口（source: 4辺） */}
      <Handle
        type="source"
        position={Position.Top}
        id="group-source-top"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="group-source-bottom"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="source"
        position={Position.Left}
        id="group-source-left"
        className={groupHandleClass}
        isConnectable
      />
      <Handle
        type="source"
        position={Position.Right}
        id="group-source-right"
        className={groupHandleClass}
        isConnectable
      />

      {/* ヘッダー（ドラッグハンドル） */}
      <div className="org-group-drag-handle flex items-center justify-between gap-1 px-3 py-2 border-b border-gray-100 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="font-semibold text-sm text-gray-800 truncate">
            {group.name}
          </span>
          <span className="text-gray-400 text-sm shrink-0">:</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-gray-400 hover:text-gray-600 p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onSelect={handleAddSubGroup}>
              <FolderPlus className="w-4 h-4 mr-2" />
              サブ部署を追加
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              編集
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* フッター: この部署の中に部署を追加する */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5">
        <button
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
          onClick={handleAddSubGroup as React.MouseEventHandler}
        >
          <Plus className="w-3 h-3" />
          <span>サブ部署を追加</span>
        </button>
      </div>
    </div>
  );
}

export const OrgGroupNode = memo(OrgGroupNodeComponent);
