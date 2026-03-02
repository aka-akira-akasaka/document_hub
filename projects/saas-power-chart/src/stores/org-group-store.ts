import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrgGroup } from "@/types/org-group";
import { MOCK_DEAL_ID, MOCK_ORG_GROUPS } from "@/lib/mock-data";

const EMPTY_GROUPS: OrgGroup[] = [];

interface OrgGroupState {
  groupsByDeal: Record<string, OrgGroup[]>;

  addGroup: (data: {
    dealId: string;
    name: string;
    parentGroupId: string | null;
    color?: string;
  }) => OrgGroup;

  updateGroup: (id: string, dealId: string, updates: Partial<OrgGroup>) => void;
  deleteGroup: (id: string, dealId: string) => void;
  getGroupsByDeal: (dealId: string) => OrgGroup[];
  getGroupById: (id: string, dealId: string) => OrgGroup | undefined;

  /** 指定グループの子孫グループIDを全て返す（再帰） */
  getDescendantIds: (id: string, dealId: string) => string[];

  /** 指定グループの深さを返す（ルート=0） */
  getGroupDepth: (id: string, dealId: string) => number;
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
    }),
    {
      name: "power-chart-org-groups",
      version: 3,
      migrate: (_persisted, version) => {
        // v2→v3: 古いモックデータをリセット（onRehydrateStorageで再投入される）
        if (version < 3) {
          return { groupsByDeal: {} } as unknown as OrgGroupState;
        }
        return _persisted as OrgGroupState;
      },
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
