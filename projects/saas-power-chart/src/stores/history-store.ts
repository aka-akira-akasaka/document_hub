import { create } from "zustand";
import { useStakeholderStore } from "./stakeholder-store";
import { useOrgGroupStore } from "./org-group-store";
import type { Stakeholder } from "@/types/stakeholder";
import type { Relationship } from "@/types/relationship";
import type { OrgLevelEntry } from "./stakeholder-store";
import type { OrgGroup } from "@/types/org-group";

const MAX_HISTORY = 50;

interface StateSnapshot {
  stakeholdersByDeal: Record<string, Stakeholder[]>;
  relationshipsByDeal: Record<string, Relationship[]>;
  orgLevelConfigByDeal: Record<string, OrgLevelEntry[]>;
  groupsByDeal: Record<string, OrgGroup[]>;
}

interface HistoryState {
  past: StateSnapshot[];
  future: StateSnapshot[];
  captureSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function takeSnapshot(): StateSnapshot {
  const sh = useStakeholderStore.getState();
  const og = useOrgGroupStore.getState();
  return {
    stakeholdersByDeal: structuredClone(sh.stakeholdersByDeal),
    relationshipsByDeal: structuredClone(sh.relationshipsByDeal),
    orgLevelConfigByDeal: structuredClone(sh.orgLevelConfigByDeal),
    groupsByDeal: structuredClone(og.groupsByDeal),
  };
}

function restoreSnapshot(snapshot: StateSnapshot) {
  useStakeholderStore.setState({
    stakeholdersByDeal: snapshot.stakeholdersByDeal,
    relationshipsByDeal: snapshot.relationshipsByDeal,
    orgLevelConfigByDeal: snapshot.orgLevelConfigByDeal,
  });
  useOrgGroupStore.setState({
    groupsByDeal: snapshot.groupsByDeal,
  });
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],

  captureSnapshot: () => {
    const snapshot = takeSnapshot();
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), snapshot],
      future: [],
    }));
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const currentSnapshot = takeSnapshot();
    const previousSnapshot = past[past.length - 1];

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, currentSnapshot],
    }));

    restoreSnapshot(previousSnapshot);
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const currentSnapshot = takeSnapshot();
    const nextSnapshot = future[future.length - 1];

    set((state) => ({
      past: [...state.past, currentSnapshot],
      future: state.future.slice(0, -1),
    }));

    restoreSnapshot(nextSnapshot);
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
