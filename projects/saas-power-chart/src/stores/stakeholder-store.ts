import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stakeholder } from "@/types/stakeholder";
import type { Relationship } from "@/types/relationship";
import type { RelationshipType } from "@/types/relationship";

const EMPTY_STAKEHOLDERS: Stakeholder[] = [];
const EMPTY_RELATIONSHIPS: Relationship[] = [];

interface StakeholderState {
  stakeholdersByDeal: Record<string, Stakeholder[]>;
  relationshipsByDeal: Record<string, Relationship[]>;

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

  updateNodePosition: (
    id: string,
    dealId: string,
    position: { x: number; y: number }
  ) => void;
}

export const useStakeholderStore = create<StakeholderState>()(
  persist(
    (set, get) => ({
      stakeholdersByDeal: {},
      relationshipsByDeal: {},

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
          return {
            stakeholdersByDeal: restStakeholders,
            relationshipsByDeal: restRelationships,
          };
        }),

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
    }),
    { name: "power-chart-stakeholders" }
  )
);
