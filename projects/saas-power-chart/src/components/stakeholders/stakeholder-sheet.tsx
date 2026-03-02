"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StakeholderForm } from "./stakeholder-form";
import { StakeholderDetail } from "./stakeholder-detail";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useHistoryStore } from "@/stores/history-store";
import { toast } from "sonner";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY: Stakeholder[] = [];

interface StakeholderSheetProps {
  dealId: string;
}

export function StakeholderSheet({ dealId }: StakeholderSheetProps) {
  const sheetOpen = useUiStore((s) => s.sheetOpen);
  const selectedId = useUiStore((s) => s.selectedStakeholderId);
  const sheetMode = useUiStore((s) => s.sheetMode);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const openSheet = useUiStore((s) => s.openSheet);
  const createParentId = useUiStore((s) => s.createParentId);
  const createChildToRelink = useUiStore((s) => s.createChildToRelink);
  const createOrgLevel = useUiStore((s) => s.createOrgLevel);

  const stakeholder = useStakeholderStore((s) =>
    selectedId ? (s.stakeholdersByDeal[dealId] ?? EMPTY).find((sh) => sh.id === selectedId) : undefined
  );
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );
  const deleteStakeholder = useStakeholderStore((s) => s.deleteStakeholder);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);

  const parentOptions = stakeholders.map((s) => ({ id: s.id, name: s.name }));

  const handleDelete = () => {
    if (stakeholder) {
      captureSnapshot();
      // 削除対象の子ノードを親に繋ぎ直し
      const children = stakeholders.filter((s) => s.parentId === stakeholder.id);
      for (const child of children) {
        updateStakeholder(child.id, dealId, {
          parentId: stakeholder.parentId,
        });
      }
      deleteStakeholder(stakeholder.id, dealId);
      toast.success(`${stakeholder.name} を削除しました`);
      closeSheet();
    }
  };

  const title =
    sheetMode === "create"
      ? "ステークホルダーを追加"
      : sheetMode === "edit"
        ? "ステークホルダーを編集"
        : stakeholder?.name ?? "";

  return (
    <Dialog open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {sheetMode === "view" && stakeholder && (
          <StakeholderDetail
            stakeholder={stakeholder}
            onEdit={() => openSheet(stakeholder.id, "edit")}
            onDelete={handleDelete}
          />
        )}

        {(sheetMode === "edit" || sheetMode === "create") && (
          <StakeholderForm
            dealId={dealId}
            stakeholder={sheetMode === "edit" ? stakeholder : undefined}
            onClose={closeSheet}
            parentOptions={parentOptions}
            defaultParentId={sheetMode === "create" ? createParentId : null}
            childToRelink={sheetMode === "create" ? createChildToRelink : null}
            defaultOrgLevel={sheetMode === "create" ? createOrgLevel : null}
            onDelete={sheetMode === "edit" && stakeholder ? handleDelete : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
