"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DealHeader } from "@/components/deals/deal-header";
import { DealTabs } from "@/components/layout/deal-tabs";
import { StakeholderSheet } from "@/components/stakeholders/stakeholder-sheet";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
import { BatchAddDialog } from "@/components/stakeholders/batch-add-dialog";
import { useCsvExport } from "@/components/csv/csv-export-button";
import { useDealStore } from "@/stores/deal-store";
import { useUiStore } from "@/stores/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const dealId = params.dealId as string;
  const deal = useDealStore((s) => s.getDealById(dealId));
  const openCsvImport = useUiStore((s) => s.openCsvImport);
  const openBatchAdd = useUiStore((s) => s.openBatchAdd);
  const { handleExport, handleYamlExport } = useCsvExport({
    dealId,
    dealName: deal?.name ?? "export",
  });

  useEffect(() => {
    if (hydrated && !deal) {
      router.push("/");
    }
  }, [hydrated, deal, router]);

  if (!hydrated || !deal) return null;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <DealHeader
        deal={deal}
        onBatchAddClick={openBatchAdd}
        onImportClick={openCsvImport}
        onCsvExportClick={handleExport}
        onYamlExportClick={handleYamlExport}
      />
      <DealTabs dealId={dealId} />
      <div className="flex-1 flex flex-col">{children}</div>
      <StakeholderSheet dealId={dealId} />
      <CsvImportDialog dealId={dealId} />
      <BatchAddDialog dealId={dealId} />
    </div>
  );
}
