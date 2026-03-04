"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DealHeader } from "@/components/deals/deal-header";
import { DealTabs } from "@/components/layout/deal-tabs";
import { StakeholderSheet } from "@/components/stakeholders/stakeholder-sheet";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
// BatchAddDialogは廃止（インポート機能に統合）
import { useCsvExport } from "@/components/csv/csv-export-button";
import { useDealStore } from "@/stores/deal-store";
import { useUiStore } from "@/stores/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";

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
  const openCsvImport = useUiStore((s) => s.openCsvImport);
  const requestPdfExport = useUiStore((s) => s.requestPdfExport);
  const isPdfExporting = useUiStore((s) => s.isPdfExporting);
  const { handleExport, handleYamlExport } = useCsvExport({
    dealId,
    dealName: deal?.name ?? "export",
  });

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
        onImportClick={openCsvImport}
        onCsvExportClick={handleExport}
        onYamlExportClick={handleYamlExport}
        onPdfExportClick={requestPdfExport}
        isPdfExporting={isPdfExporting}
      />
      <DealTabs dealId={dealId} />
      <div className="flex-1 flex flex-col">{children}</div>
      <StakeholderSheet dealId={dealId} />
      <CsvImportDialog dealId={dealId} />
      {/* BatchAddDialogは廃止 */}
    </div>
  );
}
