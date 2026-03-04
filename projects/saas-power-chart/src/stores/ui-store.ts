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

/** 通過レイヤーの+ボタンから追加する場合のコンテキスト */
export interface AddFromLayerContext {
  type: "layer";
  sourceId: string;
  targetId: string;
  orgLevel: number;
}

/** グループの「＋人を追加する」ボタンから追加する場合のコンテキスト */
export interface AddFromGroupContext {
  type: "group";
  groupId: string;
}

export type AddContext = AddFromNodeContext | AddFromEdgeContext | AddFromLayerContext | AddFromGroupContext | null;

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

  /** +ボタン経由で作成する際のデフォルトparentId */
  createParentId: string | null;
  /** +ボタン経由で作成した後にリンクし直す子ノードID */
  createChildToRelink: string | null;
  /** +ボタン経由で作成する際の推定orgLevel */
  createOrgLevel: number | null;

  openSheet: (
    id: string | null,
    mode: "view" | "edit" | "create"
  ) => void;
  /** +ボタン経由でcreateモードを開く（parentIdとchildToRelinkを保持） */
  openSheetForCreate: (parentId: string | null, childToRelink: string | null, orgLevel?: number | null) => void;
  closeSheet: () => void;
  openCsvImport: () => void;
  closeCsvImport: () => void;
  openBatchAdd: () => void;
  closeBatchAdd: () => void;

  /** +ボタンからの追加ポップオーバーを開く */
  openAddPopover: (context: NonNullable<AddContext>, position: { x: number; y: number }) => void;
  /** 追加ポップオーバーを閉じる */
  closeAddPopover: () => void;

  /** グループ管理パネル */
  groupManagerOpen: boolean;
  openGroupManager: () => void;
  closeGroupManager: () => void;

  /** グループ作成/編集フォーム（⋮メニューから開く） */
  groupFormOpen: boolean;
  groupFormEditId: string | null;
  groupFormParentId: string | null;
  openGroupFormForChild: (parentGroupId: string | null) => void;
  openGroupFormForEdit: (groupId: string) => void;
  closeGroupForm: () => void;

  /** +ボタン経由で作成する際のデフォルトgroupId */
  createGroupId: string | null;

  /** コネクタ接続後のタイプ選択ダイアログ用 */
  pendingConnection: {
    sourceId: string;
    targetId: string;
    targetType: "stakeholder" | "group";
  } | null;
  setPendingConnection: (conn: { sourceId: string; targetId: string; targetType: "stakeholder" | "group" }) => void;
  clearPendingConnection: () => void;

  /** D&D時のドラッグオーバー対象グループ */
  dragOverGroupId: string | null;
  setDragOverGroupId: (groupId: string | null) => void;

  /** D&D中のノードID（グループ並べ替えアニメーション用） */
  draggingNodeId: string | null;
  setDraggingNodeId: (id: string | null) => void;

  /** ドラッグ中の並べ替えプレビュー */
  reorderPreview: {
    parentGroupId: string | null;
    draggedGroupId: string;
    insertIndex: number;
  } | null;
  setReorderPreview: (preview: { parentGroupId: string | null; draggedGroupId: string; insertIndex: number } | null) => void;
  clearReorderPreview: () => void;

  /** 新規作成されたグループにスクロールする */
  scrollToGroupId: string | null;
  setScrollToGroup: (id: string) => void;
  clearScrollToGroup: () => void;

  /** PDF出力 */
  pdfExportRequested: boolean;
  isPdfExporting: boolean;
  requestPdfExport: () => void;
  clearPdfExportRequest: () => void;
  setIsPdfExporting: (v: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sheetOpen: false,
  selectedStakeholderId: null,
  sheetMode: "view",
  csvImportDialogOpen: false,
  batchAddDialogOpen: false,
  addContext: null,
  addPopoverPosition: null,
  createParentId: null,
  createChildToRelink: null,
  createOrgLevel: null,
  createGroupId: null,

  openSheet: (id, mode) =>
    set({
      sheetOpen: true,
      selectedStakeholderId: id,
      sheetMode: mode,
      createParentId: null,
      createChildToRelink: null,
      createOrgLevel: null,
      createGroupId: null,
    }),
  openSheetForCreate: (parentId, childToRelink, orgLevel) =>
    set({
      sheetOpen: true,
      selectedStakeholderId: null,
      sheetMode: "create",
      createParentId: parentId,
      createChildToRelink: childToRelink,
      createOrgLevel: orgLevel ?? null,
    }),
  closeSheet: () =>
    set({
      sheetOpen: false,
      selectedStakeholderId: null,
      sheetMode: "view",
      createParentId: null,
      createChildToRelink: null,
      createOrgLevel: null,
      createGroupId: null,
    }),
  openCsvImport: () => set({ csvImportDialogOpen: true }),
  closeCsvImport: () => set({ csvImportDialogOpen: false }),
  openBatchAdd: () => set({ batchAddDialogOpen: true }),
  closeBatchAdd: () => set({ batchAddDialogOpen: false }),
  openAddPopover: (context, position) =>
    set({ addContext: context, addPopoverPosition: position }),
  closeAddPopover: () =>
    set({ addContext: null, addPopoverPosition: null }),

  groupManagerOpen: false,
  openGroupManager: () => set({ groupManagerOpen: true }),
  closeGroupManager: () => set({ groupManagerOpen: false }),

  groupFormOpen: false,
  groupFormEditId: null,
  groupFormParentId: null,
  openGroupFormForChild: (parentGroupId) =>
    set({ groupFormOpen: true, groupFormEditId: null, groupFormParentId: parentGroupId }),
  openGroupFormForEdit: (groupId) =>
    set({ groupFormOpen: true, groupFormEditId: groupId, groupFormParentId: null }),
  closeGroupForm: () =>
    set({ groupFormOpen: false, groupFormEditId: null, groupFormParentId: null }),

  pendingConnection: null,
  setPendingConnection: (conn) => set({ pendingConnection: conn }),
  clearPendingConnection: () => set({ pendingConnection: null }),

  dragOverGroupId: null,
  setDragOverGroupId: (groupId) => set({ dragOverGroupId: groupId }),

  draggingNodeId: null,
  setDraggingNodeId: (id) => set({ draggingNodeId: id }),

  reorderPreview: null,
  setReorderPreview: (preview) => set({ reorderPreview: preview }),
  clearReorderPreview: () => set({ reorderPreview: null, draggingNodeId: null }),

  scrollToGroupId: null,
  setScrollToGroup: (id) => set({ scrollToGroupId: id }),
  clearScrollToGroup: () => set({ scrollToGroupId: null }),

  pdfExportRequested: false,
  isPdfExporting: false,
  requestPdfExport: () => set({ pdfExportRequested: true }),
  clearPdfExportRequest: () => set({ pdfExportRequested: false }),
  setIsPdfExporting: (v) => set({ isPdfExporting: v }),
}));
