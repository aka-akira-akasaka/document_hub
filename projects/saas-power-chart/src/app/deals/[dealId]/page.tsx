"use client";

import { useParams } from "next/navigation";
import { OrgChartCanvas } from "@/components/org-chart/org-chart-canvas";

export default function OrgChartPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  return <OrgChartCanvas dealId={dealId} />;
}
