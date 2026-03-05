"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DealHeader } from "@/components/deals/deal-header";
import { DealTabs } from "@/components/layout/deal-tabs";
import { StakeholderSheet } from "@/components/stakeholders/stakeholder-sheet";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
import { DealShareDialog } from "@/components/deals/deal-share-dialog";
import { useCsvExport } from "@/components/csv/csv-export-button";
import { useDealStore } from "@/stores/deal-store";
import { useUiStore } from "@/stores/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useIsOwner, useIsReadOnly } from "@/hooks/use-is-read-only";
import { duplicateDeal } from "@/lib/deal-duplicator";
import { toast } from "sonner";

/**
 * Hydrationガードラッパー
 * Zustand persist の hydration 完了までストア依存UIをマウントしない。
 */
export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return <DealLayoutContent>{children}</DealLayoutContent>;
}

/** Zustand ストア依存の実コンテンツ（Hydration完了後にのみマウントされる） */
function DealLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const deal = useDealStore((s) => s.deals.find((d) => d.id === dealId));
  const isActive = !!deal && !deal.trashedAt;
  const isOwner = useIsOwner(dealId);
  const isReadOnly = useIsReadOnly(dealId);
  const openCsvImport = useUiStore((s) => s.openCsvImport);
  const requestPdfExport = useUiStore((s) => s.requestPdfExport);
  const isPdfExporting = useUiStore((s) => s.isPdfExporting);
  const { handleExport, handleYamlExport } = useCsvExport({
    dealId,
    dealName: deal?.name ?? "export",
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleDuplicate = async () => {
    try {
      const newId = await duplicateDeal(dealId);
      router.push(`/deals/${newId}`);
      toast.success("案件をコピーしました");
    } catch {
      toast.error("案件のコピーに失敗しました");
    }
  };

  useEffect(() => {
    if (!isActive) {
      router.push("/");
    }
  }, [isActive, router]);

  if (!isActive) return null;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <DealHeader
        deal={deal}
        isOwner={isOwner}
        onImportClick={openCsvImport}
        onCsvExportClick={handleExport}
        onYamlExportClick={handleYamlExport}
        onPdfExportClick={requestPdfExport}
        onShareClick={() => setShareDialogOpen(true)}
        onDuplicateClick={handleDuplicate}
        isPdfExporting={isPdfExporting}
      />
      {isReadOnly && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-700">
          この案件は閲覧のみの共有です
        </div>
      )}
      <DealTabs dealId={dealId} />
      <div className="flex-1 flex flex-col">{children}</div>
      <StakeholderSheet dealId={dealId} />
      <CsvImportDialog dealId={dealId} />
      {isOwner && (
        <DealShareDialog
          dealId={dealId}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
}
