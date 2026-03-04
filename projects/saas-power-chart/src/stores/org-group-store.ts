import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { OrgGroup } from "@/types/org-group";

const EMPTY_GROUPS: OrgGroup[] = [];

interface OrgGroupState {
  groupsByDeal: Record<string, OrgGroup[]>;

  addGroup: (data: {
    dealId: string;
    name: string;
    parentGroupId: string | null;
    color?: string;
    tier?: number;
  }) => OrgGroup;

  updateGroup: (id: string, dealId: string, updates: Partial<OrgGroup>) => void;
  deleteGroup: (id: string, dealId: string) => void;
  getGroupsByDeal: (dealId: string) => OrgGroup[];
  getGroupById: (id: string, dealId: string) => OrgGroup | undefined;

  /** 指定グループの子孫グループIDを全て返す（再帰） */
  getDescendantIds: (id: string, dealId: string) => string[];

  /** 指定グループの深さを返す（ルート=0） */
  getGroupDepth: (id: string, dealId: string) => number;

  /** 兄弟グループ内での表示順序を変更する（D&D横並び入れ替え用） */
  reorderGroup: (id: string, dealId: string, newIndex: number) => void;

  /** Supabase からの一括読み込み用 */
  hydrate: (groupsByDeal: Record<string, OrgGroup[]>) => void;
  /** ログアウト時のリセット用 */
  reset: () => void;
}

export const useOrgGroupStore = create<OrgGroupState>()(
  subscribeWithSelector((set, get) => ({
    groupsByDeal: {},

    addGroup: (data) => {
      const existing = get().groupsByDeal[data.dealId] ?? [];
      // 兄弟グループ内の最大sortOrderを算出し、末尾に追加
      const siblings = existing.filter((g) => g.parentGroupId === data.parentGroupId);
      const maxOrder = siblings.reduce((max, g) => Math.max(max, g.sortOrder ?? 0), -1);

      const group: OrgGroup = {
        id: crypto.randomUUID(),
        dealId: data.dealId,
        name: data.name,
        parentGroupId: data.parentGroupId,
        color: data.color,
        sortOrder: maxOrder + 1,
        tier: data.tier ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => {
        const list = state.groupsByDeal[data.dealId] ?? [];
        return {
          groupsByDeal: {
            ...state.groupsByDeal,
            [data.dealId]: [...list, group],
          },
        };
      });
      return group;
    },

    updateGroup: (id, dealId, updates) =>
      set((state) => {
        const list = state.groupsByDeal[dealId] ?? [];
        return {
          groupsByDeal: {
            ...state.groupsByDeal,
            [dealId]: list.map((g) =>
              g.id === id
                ? { ...g, ...updates, updatedAt: new Date().toISOString() }
                : g
            ),
          },
        };
      }),

    deleteGroup: (id, dealId) =>
      set((state) => {
        const list = state.groupsByDeal[dealId] ?? [];
        // 子孫グループも同時に削除
        const descendantIds = get().getDescendantIds(id, dealId);
        const idsToDelete = new Set([id, ...descendantIds]);
        return {
          groupsByDeal: {
            ...state.groupsByDeal,
            [dealId]: list.filter((g) => !idsToDelete.has(g.id)),
          },
        };
      }),

    getGroupsByDeal: (dealId) =>
      get().groupsByDeal[dealId] ?? EMPTY_GROUPS,

    getGroupById: (id, dealId) =>
      (get().groupsByDeal[dealId] ?? EMPTY_GROUPS).find((g) => g.id === id),

    getDescendantIds: (id, dealId) => {
      const list = get().groupsByDeal[dealId] ?? [];
      const result: string[] = [];
      const queue = [id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = list.filter((g) => g.parentGroupId === current);
        for (const child of children) {
          result.push(child.id);
          queue.push(child.id);
        }
      }
      return result;
    },

    getGroupDepth: (id, dealId) => {
      const list = get().groupsByDeal[dealId] ?? [];
      const groupMap = new Map(list.map((g) => [g.id, g]));
      let depth = 0;
      let current = groupMap.get(id);
      while (current?.parentGroupId) {
        depth++;
        current = groupMap.get(current.parentGroupId);
        if (depth > 100) break; // 循環参照ガード
      }
      return depth;
    },

    reorderGroup: (id, dealId, newIndex) =>
      set((state) => {
        const list = state.groupsByDeal[dealId] ?? [];
        const group = list.find((g) => g.id === id);
        if (!group) return state;

        // 同じ親を持つ兄弟をsortOrder順で取得
        const siblings = list
          .filter((g) => g.parentGroupId === group.parentGroupId)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        // 対象を除外して新しい位置に挿入
        const filtered = siblings.filter((g) => g.id !== id);
        const clampedIndex = Math.max(0, Math.min(newIndex, filtered.length));
        filtered.splice(clampedIndex, 0, group);

        // sortOrderを0始まりで振り直す
        const orderMap = new Map<string, number>();
        filtered.forEach((g, i) => orderMap.set(g.id, i));

        const now = new Date().toISOString();
        return {
          groupsByDeal: {
            ...state.groupsByDeal,
            [dealId]: list.map((g) => {
              const newOrder = orderMap.get(g.id);
              if (newOrder !== undefined && newOrder !== g.sortOrder) {
                return { ...g, sortOrder: newOrder, updatedAt: now };
              }
              return g;
            }),
          },
        };
      }),

    hydrate: (groupsByDeal) => set({ groupsByDeal }),
    reset: () => set({ groupsByDeal: {} }),
  }))
);
