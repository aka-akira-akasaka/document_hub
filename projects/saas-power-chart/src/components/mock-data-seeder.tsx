"use client";

/**
 * モックデータ自動シーダー（仮置き・確認後削除）
 */
import { useEffect } from "react";
import { useDealStore } from "@/stores/deal-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";

export function MockDataSeeder() {
  const seedDeals = useDealStore((s) => s.seedMockData);
  const seedStakeholders = useStakeholderStore((s) => s.seedMockData);

  useEffect(() => {
    seedDeals();
    seedStakeholders();
  }, [seedDeals, seedStakeholders]);

  return null;
}
