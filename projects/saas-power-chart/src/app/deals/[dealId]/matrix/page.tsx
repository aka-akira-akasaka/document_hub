"use client";

import { useParams } from "next/navigation";
import { InfluenceAttitudeMatrix } from "@/components/matrix/influence-attitude-matrix";

export default function MatrixPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  return <InfluenceAttitudeMatrix dealId={dealId} />;
}
