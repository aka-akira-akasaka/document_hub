"use client";

/**
 * モックデータ自動シーダー（仮置き・確認後削除）
 * useRef で二重実行を防止
 */
import { useEffect, useRef } from "react";
import { useDealStore } from "@/stores/deal-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";

export function MockDataSeeder() {
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    useDealStore.getState().seedMockData();
    useStakeholderStore.getState().seedMockData();
    useOrgGroupStore.getState().seedMockData();
  }, []);

  return null;
}
