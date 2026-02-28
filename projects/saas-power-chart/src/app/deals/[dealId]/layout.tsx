"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { DealHeader } from "@/components/deals/deal-header";
import { DealTabs } from "@/components/layout/deal-tabs";
import { StakeholderSheet } from "@/components/stakeholders/stakeholder-sheet";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
import { useCsvExport } from "@/components/csv/csv-export-button";
import { useDealStore } from "@/stores/deal-store";
import { useUiStore } from "@/stores/ui-store";

export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const deal = useDealStore((s) => s.getDealById(dealId));
  const openCsvImport = useUiStore((s) => s.openCsvImport);
  const { handleExport } = useCsvExport({
    dealId,
    dealName: deal?.name ?? "export",
  });

  useEffect(() => {
    if (!deal) {
      router.push("/");
    }
  }, [deal, router]);

  if (!deal) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <DealHeader
        deal={deal}
        onImportClick={openCsvImport}
        onExportClick={handleExport}
      />
      <DealTabs dealId={dealId} />
      <div className="flex-1 flex flex-col">{children}</div>
      <StakeholderSheet dealId={dealId} />
      <CsvImportDialog dealId={dealId} />
    </div>
  );
}
