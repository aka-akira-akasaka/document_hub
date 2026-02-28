"use client";

import { useStakeholderStore } from "@/stores/stakeholder-store";
import { exportCSV, downloadCSV } from "@/lib/csv-parser";
import { toast } from "sonner";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY: Stakeholder[] = [];

interface CsvExportButtonProps {
  dealId: string;
  dealName: string;
}

export function useCsvExport({ dealId, dealName }: CsvExportButtonProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );

  const handleExport = () => {
    if (stakeholders.length === 0) {
      toast.error("エクスポートするステークホルダーがいません");
      return;
    }

    const csv = exportCSV(stakeholders);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadCSV(csv, `${dealName}_${date}.csv`);
    toast.success(`${stakeholders.length}件をCSVエクスポートしました`);
  };

  return { handleExport };
}
