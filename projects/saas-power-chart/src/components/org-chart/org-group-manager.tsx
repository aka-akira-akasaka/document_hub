"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { useOrgGroupStore } from "@/stores/org-group-store";
import type { OrgGroup } from "@/types/org-group";
import { OrgGroupForm } from "./org-group-form";

const EMPTY_GROUPS: OrgGroup[] = [];

interface OrgGroupManagerProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgGroupManager({
  dealId,
  open,
  onOpenChange,
}: OrgGroupManagerProps) {
  const groups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const [formOpen, setFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<OrgGroup | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // ルートグループ（parentGroupId=null）
  const rootGroups = groups.filter((g) => !g.parentGroupId);

  const handleAddRoot = () => {
    setEditGroup(null);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditGroup(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  };

  const handleEdit = (group: OrgGroup) => {
    setEditGroup(group);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const renderGroup = (group: OrgGroup, depth: number) => {
    const children = groups.filter((g) => g.parentGroupId === group.id);

    return (
      <div key={group.id} style={{ marginLeft: depth * 16 }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer group"
          onClick={() => handleEdit(group)}
        >
          {children.length > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-400"
          />
          <span className="text-sm font-medium flex-1 truncate">
            {group.name}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleAddChild(group.id);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {children.map((child) => renderGroup(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[360px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>部門グループ管理</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button
              onClick={handleAddRoot}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              部門を追加
            </Button>

            {rootGroups.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                部門グループがありません。
                <br />
                「部門を追加」から作成してください。
              </div>
            ) : (
              <div className="mt-2 space-y-0.5">
                {rootGroups.map((g) => renderGroup(g, 0))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <OrgGroupForm
        dealId={dealId}
        open={formOpen}
        onOpenChange={setFormOpen}
        editGroup={editGroup}
        defaultParentGroupId={defaultParentId}
      />
    </>
  );
}
