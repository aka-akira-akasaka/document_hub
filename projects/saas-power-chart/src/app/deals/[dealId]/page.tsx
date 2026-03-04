"use client";

import { useParams } from "next/navigation";
import { OrgChartCanvas } from "@/components/org-chart/org-chart-canvas";
import { useDealStore } from "@/stores/deal-store";

export default function OrgChartPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const dealName = useDealStore((s) => s.deals.find((d) => d.id === dealId)?.name ?? "export");

  return <OrgChartCanvas dealId={dealId} dealName={dealName} />;
}
