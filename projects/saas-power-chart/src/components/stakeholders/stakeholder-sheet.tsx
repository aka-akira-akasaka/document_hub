"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  const title =
    sheetMode === "create"
      ? "ステークホルダーを追加"
      : sheetMode === "edit"
        ? "ステークホルダーを編集"
        : stakeholder?.name ?? "";

  return (
    <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

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
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
