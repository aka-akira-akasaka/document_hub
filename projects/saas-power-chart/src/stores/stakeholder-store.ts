import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stakeholder } from "@/types/stakeholder";
import type { Relationship } from "@/types/relationship";
import type { RelationshipType } from "@/types/relationship";
import { MOCK_DEAL_ID, MOCK_STAKEHOLDERS } from "@/lib/mock-data";

const EMPTY_STAKEHOLDERS: Stakeholder[] = [];
const EMPTY_RELATIONSHIPS: Relationship[] = [];

/** 案件ごとの組織階層定義（順序 = レベル番号） */
export interface OrgLevelEntry {
  level: number;
  label: string;
}

const EMPTY_ORG_LEVELS: OrgLevelEntry[] = [];

interface StakeholderState {
  stakeholdersByDeal: Record<string, Stakeholder[]>;
  relationshipsByDeal: Record<string, Relationship[]>;
  /** 案件ごとの階層定義 */
  orgLevelConfigByDeal: Record<string, OrgLevelEntry[]>;

  addStakeholder: (
    data: Omit<Stakeholder, "id" | "createdAt" | "updatedAt">
  ) => Stakeholder;
  updateStakeholder: (
    id: string,
    dealId: string,
    updates: Partial<Stakeholder>
  ) => void;
  deleteStakeholder: (id: string, dealId: string) => void;
  getStakeholdersByDeal: (dealId: string) => Stakeholder[];
  getStakeholderById: (
    id: string,
    dealId: string
  ) => Stakeholder | undefined;

  addRelationship: (data: {
    dealId: string;
    sourceId: string;
    targetId: string;
    type: RelationshipType;
    label?: string;
    bidirectional: boolean;
  }) => Relationship;
  deleteRelationship: (id: string, dealId: string) => void;
  getRelationshipsByDeal: (dealId: string) => Relationship[];

  importStakeholders: (dealId: string, stakeholders: Stakeholder[]) => void;
  clearDealData: (dealId: string) => void;

  /** 案件の階層定義を取得 */
  getOrgLevels: (dealId: string) => OrgLevelEntry[];
  /** 案件の階層定義を丸ごと更新 */
  setOrgLevels: (dealId: string, levels: OrgLevelEntry[]) => void;

  updateNodePosition: (
    id: string,
    dealId: string,
    position: { x: number; y: number }
  ) => void;

  /** モックデータをシード（仮置き・確認後削除） */
  seedMockData: () => void;
}

export const useStakeholderStore = create<StakeholderState>()(
  persist(
    (set, get) => ({
      stakeholdersByDeal: {},
      relationshipsByDeal: {},
      orgLevelConfigByDeal: {},

      addStakeholder: (data) => {
        const stakeholder: Stakeholder = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.stakeholdersByDeal[data.dealId] ?? [];
          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [data.dealId]: [...existing, stakeholder],
            },
          };
        });
        return stakeholder;
      },

      updateStakeholder: (id, dealId, updates) =>
        set((state) => {
          const list = state.stakeholdersByDeal[dealId] ?? [];
          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [dealId]: list.map((s) =>
                s.id === id
                  ? { ...s, ...updates, updatedAt: new Date().toISOString() }
                  : s
              ),
            },
          };
        }),

      deleteStakeholder: (id, dealId) =>
        set((state) => {
          const list = state.stakeholdersByDeal[dealId] ?? [];
          const rels = state.relationshipsByDeal[dealId] ?? [];
          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [dealId]: list.filter((s) => s.id !== id),
            },
            relationshipsByDeal: {
              ...state.relationshipsByDeal,
              [dealId]: rels.filter(
                (r) => r.sourceId !== id && r.targetId !== id
              ),
            },
          };
        }),

      getStakeholdersByDeal: (dealId) =>
        get().stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS,

      getStakeholderById: (id, dealId) =>
        (get().stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS).find((s) => s.id === id),

      addRelationship: (data) => {
        const relationship: Relationship = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.relationshipsByDeal[data.dealId] ?? [];
          return {
            relationshipsByDeal: {
              ...state.relationshipsByDeal,
              [data.dealId]: [...existing, relationship],
            },
          };
        });
        return relationship;
      },

      deleteRelationship: (id, dealId) =>
        set((state) => {
          const list = state.relationshipsByDeal[dealId] ?? [];
          return {
            relationshipsByDeal: {
              ...state.relationshipsByDeal,
              [dealId]: list.filter((r) => r.id !== id),
            },
          };
        }),

      getRelationshipsByDeal: (dealId) =>
        get().relationshipsByDeal[dealId] ?? EMPTY_RELATIONSHIPS,

      importStakeholders: (dealId, stakeholders) =>
        set((state) => {
          const existing = state.stakeholdersByDeal[dealId] ?? [];
          const existingIds = new Set(existing.map((s) => s.id));
          const merged = [...existing];

          for (const s of stakeholders) {
            if (existingIds.has(s.id)) {
              const idx = merged.findIndex((e) => e.id === s.id);
              if (idx !== -1) merged[idx] = { ...merged[idx], ...s, updatedAt: new Date().toISOString() };
            } else {
              merged.push(s);
            }
          }

          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [dealId]: merged,
            },
          };
        }),

      clearDealData: (dealId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dealId]: _s, ...restStakeholders } =
            state.stakeholdersByDeal;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dealId]: _r, ...restRelationships } =
            state.relationshipsByDeal;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dealId]: _l, ...restOrgLevels } =
            state.orgLevelConfigByDeal;
          return {
            stakeholdersByDeal: restStakeholders,
            relationshipsByDeal: restRelationships,
            orgLevelConfigByDeal: restOrgLevels,
          };
        }),

      getOrgLevels: (dealId) =>
        get().orgLevelConfigByDeal[dealId] ?? EMPTY_ORG_LEVELS,

      setOrgLevels: (dealId, levels) =>
        set((state) => ({
          orgLevelConfigByDeal: {
            ...state.orgLevelConfigByDeal,
            [dealId]: levels,
          },
        })),

      updateNodePosition: (id, dealId, position) =>
        set((state) => {
          const list = state.stakeholdersByDeal[dealId] ?? [];
          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [dealId]: list.map((s) =>
                s.id === id ? { ...s, position } : s
              ),
            },
          };
        }),

      seedMockData: () =>
        set((state) => {
          if ((state.stakeholdersByDeal[MOCK_DEAL_ID] ?? []).length > 0) return state;
          return {
            stakeholdersByDeal: {
              ...state.stakeholdersByDeal,
              [MOCK_DEAL_ID]: MOCK_STAKEHOLDERS,
            },
          };
        }),
    }),
    {
      name: "power-chart-stakeholders",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        const byDeal = (state.stakeholdersByDeal ?? {}) as Record<string, Record<string, unknown>[]>;

        if (version < 2) {
          const orgConfigs = (state.orgLevelConfigByDeal ?? {}) as Record<string, { level: number }[]>;
          for (const dealId of Object.keys(byDeal)) {
            const levels = orgConfigs[dealId];
            const maxLevel = levels?.length ? Math.max(...levels.map((l) => l.level)) : 5;
            byDeal[dealId] = byDeal[dealId].map((s) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { isUnknown, ...rest } = s;
              return { ...rest, orgLevel: rest.orgLevel ?? maxLevel };
            });
          }
        }

        if (version < 3) {
          for (const dealId of Object.keys(byDeal)) {
            byDeal[dealId] = byDeal[dealId].map((s) => ({
              ...s,
              groupId: s.groupId ?? null,
            }));
          }
        }

        return { ...state, stakeholdersByDeal: byDeal } as unknown as StakeholderState;
      },
    }
  )
);
