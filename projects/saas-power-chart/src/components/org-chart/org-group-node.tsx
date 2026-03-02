"use client";

import { memo, useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import type { OrgGroup } from "@/types/org-group";
import { MoreVertical, Plus, FolderPlus, Pencil, Trash2 } from "lucide-react";
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
  const openAddPopover = useUiStore((st) => st.openAddPopover);
  const openGroupFormForChild = useUiStore((st) => st.openGroupFormForChild);
  const openGroupFormForEdit = useUiStore((st) => st.openGroupFormForEdit);
  const deleteGroup = useOrgGroupStore((st) => st.deleteGroup);

  const handleAddPerson = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // グループの実IDをコンテキストとして渡す（group-xxx ではなく元のUUID）
      openAddPopover(
        { type: "group", groupId: group.id },
        { x: e.clientX, y: e.clientY }
      );
    },
    [group.id, openAddPopover]
  );

  const handleAddSubGroup = useCallback(
    (e: Event) => {
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

  // teamレベルの下にはサブ部署追加不可
  const canAddSubGroup = group.level !== "team";

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
            {canAddSubGroup && (
              <DropdownMenuItem onSelect={handleAddSubGroup}>
                <FolderPlus className="w-4 h-4 mr-2" />
                サブ部署を追加
              </DropdownMenuItem>
            )}
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
