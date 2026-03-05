import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DealShare, ShareRole } from "@/types/deal-share";

interface DealShareState {
  /** deal_id -> DealShare[] のマップ */
  sharesByDeal: Record<string, DealShare[]>;

  /** 共有を追加 */
  addShare: (data: {
    dealId: string;
    ownerId: string;
    email: string;
    role: ShareRole;
  }) => DealShare;

  /** 共有を更新（権限変更） */
  updateShare: (id: string, dealId: string, updates: Partial<Pick<DealShare, "role">>) => void;

  /** 共有を削除 */
  removeShare: (id: string, dealId: string) => void;

  /** Supabase からの一括読み込み用 */
  hydrate: (sharesByDeal: Record<string, DealShare[]>) => void;

  /** ログアウト時のリセット用 */
  reset: () => void;
}

export const useDealShareStore = create<DealShareState>()(
  subscribeWithSelector((set) => ({
    sharesByDeal: {},

    addShare: (data) => {
      const now = new Date().toISOString();
      const share: DealShare = {
        id: crypto.randomUUID(),
        dealId: data.dealId,
        ownerId: data.ownerId,
        sharedWithEmail: data.email,
        sharedWithUserId: null,
        role: data.role,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        const existing = state.sharesByDeal[data.dealId] ?? [];
        return {
          sharesByDeal: {
            ...state.sharesByDeal,
            [data.dealId]: [...existing, share],
          },
        };
      });
      return share;
    },

    updateShare: (id, dealId, updates) => {
      set((state) => {
        const existing = state.sharesByDeal[dealId] ?? [];
        return {
          sharesByDeal: {
            ...state.sharesByDeal,
            [dealId]: existing.map((s) =>
              s.id === id
                ? { ...s, ...updates, updatedAt: new Date().toISOString() }
                : s
            ),
          },
        };
      });
    },

    removeShare: (id, dealId) => {
      set((state) => {
        const existing = state.sharesByDeal[dealId] ?? [];
        return {
          sharesByDeal: {
            ...state.sharesByDeal,
            [dealId]: existing.filter((s) => s.id !== id),
          },
        };
      });
    },

    hydrate: (sharesByDeal) => {
      set({ sharesByDeal });
    },

    reset: () => {
      set({ sharesByDeal: {} });
    },
  }))
);
