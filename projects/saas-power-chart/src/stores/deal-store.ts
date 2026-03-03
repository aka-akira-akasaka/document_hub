import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Deal, DealStage } from "@/types/deal";

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
  /** Supabase からの一括読み込み用 */
  hydrate: (deals: Deal[]) => void;
  /** ログアウト時のリセット用 */
  reset: () => void;
}

export const useDealStore = create<DealState>()(
  subscribeWithSelector((set, get) => ({
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
    hydrate: (deals) => set({ deals }),
    reset: () => set({ deals: [] }),
  }))
);
