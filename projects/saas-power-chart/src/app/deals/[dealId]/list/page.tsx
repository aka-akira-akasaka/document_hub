"use client";

import { useParams } from "next/navigation";
import { StakeholderTable } from "@/components/stakeholders/stakeholder-table";

export default function ListPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  return <StakeholderTable dealId={dealId} />;
}
