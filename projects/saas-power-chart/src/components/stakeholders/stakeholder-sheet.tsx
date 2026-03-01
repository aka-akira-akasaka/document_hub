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
  const addContext = useUiStore((s) => s.addContext);

  const stakeholder = useStakeholderStore((s) =>
    selectedId ? (s.stakeholdersByDeal[dealId] ?? EMPTY).find((sh) => sh.id === selectedId) : undefined
  );
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );
  const deleteStakeholder = useStakeholderStore((s) => s.deleteStakeholder);

  const parentOptions = stakeholders.map((s) => ({ id: s.id, name: s.name }));

  const handleDelete = () => {
    if (stakeholder) {
      deleteStakeholder(stakeholder.id, dealId);
      toast.success(`${stakeholder.name} を削除しました`);
      closeSheet();
    }
  };

  // +ボタンコンテキストからデフォルトのparentIdを決定
  const getDefaultParentId = (): string | null => {
    if (!addContext || sheetMode !== "create") return null;
    if (addContext.type === "node") {
      if (addContext.position === "below") return addContext.nodeId;
      // 上司として追加: 現在のノードの親を新ノードの親に
      const currentNode = stakeholders.find((s) => s.id === addContext.nodeId);
      return currentNode?.parentId ?? null;
    }
    if (addContext.type === "edge") {
      return addContext.sourceId;
    }
    return null;
  };

  // +ボタンコンテキストから、作成後にリンクし直す必要がある子ノードのID
  const getChildToRelink = (): string | null => {
    if (!addContext || sheetMode !== "create") return null;
    if (addContext.type === "node" && addContext.position === "above") {
      return addContext.nodeId;
    }
    if (addContext.type === "edge") {
      return addContext.targetId;
    }
    return null;
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
            defaultParentId={getDefaultParentId()}
            childToRelink={getChildToRelink()}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
