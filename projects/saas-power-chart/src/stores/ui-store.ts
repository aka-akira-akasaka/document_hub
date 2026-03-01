import { create } from "zustand";

/** ノード上下の+ボタンから追加する場合のコンテキスト */
export interface AddFromNodeContext {
  type: "node";
  nodeId: string;
  /** above: 上司として追加, below: 部下として追加 */
  position: "above" | "below";
}

/** エッジ中間の+ボタンから追加する場合のコンテキスト */
export interface AddFromEdgeContext {
  type: "edge";
  sourceId: string;
  targetId: string;
}

export type AddContext = AddFromNodeContext | AddFromEdgeContext | null;

interface UiState {
  sheetOpen: boolean;
  selectedStakeholderId: string | null;
  sheetMode: "view" | "edit" | "create";
  csvImportDialogOpen: boolean;
  batchAddDialogOpen: boolean;

  /** ノード/エッジの+ボタンから追加する際のコンテキスト */
  addContext: AddContext;
  /** 追加選択ポップオーバーの位置 */
  addPopoverPosition: { x: number; y: number } | null;

  openSheet: (
    id: string | null,
    mode: "view" | "edit" | "create"
  ) => void;
  closeSheet: () => void;
  openCsvImport: () => void;
  closeCsvImport: () => void;
  openBatchAdd: () => void;
  closeBatchAdd: () => void;

  /** +ボタンからの追加ポップオーバーを開く */
  openAddPopover: (context: NonNullable<AddContext>, position: { x: number; y: number }) => void;
  /** 追加ポップオーバーを閉じる */
  closeAddPopover: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sheetOpen: false,
  selectedStakeholderId: null,
  sheetMode: "view",
  csvImportDialogOpen: false,
  batchAddDialogOpen: false,
  addContext: null,
  addPopoverPosition: null,

  openSheet: (id, mode) =>
    set({ sheetOpen: true, selectedStakeholderId: id, sheetMode: mode }),
  closeSheet: () =>
    set({ sheetOpen: false, selectedStakeholderId: null, sheetMode: "view" }),
  openCsvImport: () => set({ csvImportDialogOpen: true }),
  closeCsvImport: () => set({ csvImportDialogOpen: false }),
  openBatchAdd: () => set({ batchAddDialogOpen: true }),
  closeBatchAdd: () => set({ batchAddDialogOpen: false }),
  openAddPopover: (context, position) =>
    set({ addContext: context, addPopoverPosition: position }),
  closeAddPopover: () =>
    set({ addContext: null, addPopoverPosition: null }),
}));
