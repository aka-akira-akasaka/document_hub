import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Deal, DealStage } from "@/types/deal";
import { MOCK_DEAL } from "@/lib/mock-data";

interface DealState {
  deals: Deal[];
  addDeal: (data: {
    name: string;
    clientName: string;
    stage: DealStage;
    description: string;
    targetAmount?: number;
    expectedCloseDate?: string;
  }) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  getDealById: (id: string) => Deal | undefined;
  /** モックデータをシード（仮置き・確認後削除） */
  seedMockData: () => void;
}

export const useDealStore = create<DealState>()(
  persist(
    (set, get) => ({
      deals: [],
      addDeal: (data) => {
        const deal: Deal = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ deals: [...state.deals, deal] }));
        return deal;
      },
      updateDeal: (id, updates) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date().toISOString() }
              : d
          ),
        })),
      deleteDeal: (id) =>
        set((state) => ({
          deals: state.deals.filter((d) => d.id !== id),
        })),
      getDealById: (id) => get().deals.find((d) => d.id === id),

      seedMockData: () =>
        set((state) => {
          if (state.deals.some((d) => d.id === MOCK_DEAL.id)) return state;
          return { deals: [...state.deals, MOCK_DEAL] };
        }),
    }),
    {
      name: "power-chart-deals",
      version: 2,
      migrate: (_persisted, version) => {
        // v1→v2: 古いモックデータ（東海ファイナンス等）をリセット
        if (typeof version !== "number" || version < 2) {
          return { deals: [] } as unknown as DealState;
        }
        return _persisted as DealState;
      },
    }
  )
);
