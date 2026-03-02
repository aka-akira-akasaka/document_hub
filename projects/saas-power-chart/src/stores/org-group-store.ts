import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrgGroup, OrgGroupLevel } from "@/types/org-group";
import { MOCK_DEAL_ID, MOCK_ORG_GROUPS } from "@/lib/mock-data";

const EMPTY_GROUPS: OrgGroup[] = [];

interface OrgGroupState {
  groupsByDeal: Record<string, OrgGroup[]>;

  addGroup: (data: {
    dealId: string;
    name: string;
    level: OrgGroupLevel;
    parentGroupId: string | null;
    color?: string;
  }) => OrgGroup;

  updateGroup: (id: string, dealId: string, updates: Partial<OrgGroup>) => void;
  deleteGroup: (id: string, dealId: string) => void;
  getGroupsByDeal: (dealId: string) => OrgGroup[];
  getGroupById: (id: string, dealId: string) => OrgGroup | undefined;

  /** 指定グループの子孫グループIDを全て返す（再帰） */
  getDescendantIds: (id: string, dealId: string) => string[];
}

export const useOrgGroupStore = create<OrgGroupState>()(
  persist(
    (set, get) => ({
      groupsByDeal: {},

      addGroup: (data) => {
        const group: OrgGroup = {
          id: crypto.randomUUID(),
          dealId: data.dealId,
          name: data.name,
          level: data.level,
          parentGroupId: data.parentGroupId,
          color: data.color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.groupsByDeal[data.dealId] ?? [];
          return {
            groupsByDeal: {
              ...state.groupsByDeal,
              [data.dealId]: [...existing, group],
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
    }),
    {
      name: "power-chart-org-groups",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // モックデータがまだ無い場合はシード
        if ((state.groupsByDeal[MOCK_DEAL_ID] ?? []).length === 0) {
          state.groupsByDeal = {
            ...state.groupsByDeal,
            [MOCK_DEAL_ID]: MOCK_ORG_GROUPS,
          };
        }
      },
    }
  )
);
