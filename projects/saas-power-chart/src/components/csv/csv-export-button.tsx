"use client";

import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { exportCSV, downloadCSV } from "@/lib/csv-parser";
import { exportYAML, downloadYAML } from "@/lib/yaml-parser";
import { toast } from "sonner";
import type { Stakeholder } from "@/types/stakeholder";
import type { OrgGroup } from "@/types/org-group";

const EMPTY_S: Stakeholder[] = [];
const EMPTY_G: OrgGroup[] = [];

interface CsvExportButtonProps {
  dealId: string;
  dealName: string;
}

export function useCsvExport({ dealId, dealName }: CsvExportButtonProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const orgGroups = useOrgGroupStore((s) =>
    s.groupsByDeal[dealId] ?? EMPTY_G
  );
  const tierConfig = useOrgGroupStore((s) =>
    s.tierConfigByDeal[dealId]
  );
  const orgLevels = useStakeholderStore((s) =>
    s.orgLevelConfigByDeal[dealId]
  );

  const handleExport = () => {
    if (stakeholders.length === 0) {
      toast.error("エクスポートするステークホルダーがいません");
      return;
    }

    const csv = exportCSV(stakeholders, orgGroups);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadCSV(csv, `${dealName}_${date}.csv`);
    toast.success(`${stakeholders.length}件をCSVエクスポートしました`);
  };

  const handleYamlExport = () => {
    if (stakeholders.length === 0) {
      toast.error("エクスポートするステークホルダーがいません");
      return;
    }

    const yamlStr = exportYAML(stakeholders, {
      orgGroups,
      tierConfig: tierConfig ?? undefined,
      orgLevels: orgLevels ?? undefined,
    });
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadYAML(yamlStr, `${dealName}_${date}.yaml`);
    toast.success(`${stakeholders.length}件をYAMLエクスポートしました`);
  };

  return { handleExport, handleYamlExport };
}
