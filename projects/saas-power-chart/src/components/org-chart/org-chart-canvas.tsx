"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeMouseHandler,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { handleAwareBezier } from "@/lib/edge-path";
import { StakeholderNode } from "./stakeholder-node";
import { RelationshipEdge } from "./relationship-edge";
import { OrgGroupNode } from "./org-group-node";
import { AddPersonPlaceholderNode } from "./add-person-placeholder-node";
import { ReorderDropIndicatorNode } from "./reorder-drop-indicator";
import { OrgChartToolbar } from "./org-chart-toolbar";
import { AddNodeMenu } from "./add-node-menu";
import { OrgLevelEditor } from "./org-level-editor";
import { OrgGroupForm } from "./org-group-form";
// LayerBackground は廃止済み（グループモードに統一）
import { useOrgChartLayout } from "@/hooks/use-org-chart-layout";
import { useGroupChartLayout } from "@/hooks/use-group-chart-layout";
import { useAutoGroupSeed } from "@/hooks/use-auto-group-seed";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useHistoryStore } from "@/stores/history-store";
import { TemplateSelector } from "./template-selector";
import { SaveTemplateDialog } from "./save-template-dialog";
import type { Stakeholder } from "@/types/stakeholder";
import { toast } from "sonner";
import { useDealStore } from "@/stores/deal-store";
import { exportOrgChartToPdf } from "@/lib/pdf-export";
import { useIsReadOnly } from "@/hooks/use-is-read-only";
import { useRealtimeCursors } from "@/hooks/use-realtime-cursors";
import { CursorOverlay } from "./cursor-overlay";

const EMPTY: Stakeholder[] = [];
const EMPTY_GROUPS: import("@/types/org-group").OrgGroup[] = [];

/** 新規作成された部署に自動スクロールするヘルパー（ReactFlow内部で使用） */
function ScrollToNewGroup() {
  const scrollToGroupId = useUiStore((s) => s.scrollToGroupId);
  const clearScrollToGroup = useUiStore((s) => s.clearScrollToGroup);
  const { fitView, getZoom } = useReactFlow();

  useEffect(() => {
    if (!scrollToGroupId) return;
    const timer = setTimeout(() => {
      fitView({
        nodes: [{ id: `group-${scrollToGroupId}` }],
        duration: 300,
        padding: 0.3,
        maxZoom: getZoom(),
      });
      clearScrollToGroup();
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollToGroupId, fitView, getZoom, clearScrollToGroup]);

  return null;
}

/** PDF出力: DealHeaderからのリクエストを検知してキャプチャ実行（ReactFlow内部で使用） */
function PdfExportEffect({ dealId }: { dealId: string }) {
  const pdfExportRequested = useUiStore((s) => s.pdfExportRequested);
  const clearPdfExportRequest = useUiStore((s) => s.clearPdfExportRequest);
  const setIsPdfExporting = useUiStore((s) => s.setIsPdfExporting);
  const dealName = useDealStore((s) => s.deals.find((d) => d.id === dealId)?.name ?? "export");
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!pdfExportRequested) return;
    clearPdfExportRequest();

    const container = document.querySelector(".react-flow") as HTMLElement;
    if (!container) return;

    setIsPdfExporting(true);
    exportOrgChartToPdf(container, dealName, () =>
      fitView({ padding: 0.1, duration: 0 })
    )
      .then(() => toast.success("PDFを出力しました"))
      .catch((e) => {
        toast.error("PDF出力に失敗しました");
        console.error(e);
      })
      .finally(() => setIsPdfExporting(false));
  }, [pdfExportRequested, clearPdfExportRequest, setIsPdfExporting, fitView, dealName]);

  return null;
}

const nodeTypes = { stakeholder: StakeholderNode, orgGroup: OrgGroupNode, addPersonPlaceholder: AddPersonPlaceholderNode, reorderDropIndicator: ReorderDropIndicatorNode };
const edgeTypes = { relationship: RelationshipEdge };

/**
 * カスタム接続線: 確定エッジと同じベジェ曲線でドラッグプレビューを描画。
 * handleAwareBezier を使い、予告ガイド線と確定線を統一。
 */
function CustomConnectionLine({ fromX, fromY, toX, toY, fromPosition, toPosition }: {
  fromX: number; fromY: number; toX: number; toY: number;
  fromPosition: Position; toPosition: Position;
  connectionLineStyle?: React.CSSProperties;
}) {
  const { path } = handleAwareBezier(fromX, fromY, fromPosition, toX, toY, toPosition);
  return (
    <g>
      <path d={path} fill="none" stroke="#b1b1b7" strokeWidth={1.5} />
    </g>
  );
}

// ReactFlowに渡すオプションをモジュールレベルで定義（毎レンダー新オブジェクト生成による無限ループ防止）
const FIT_VIEW_OPTIONS = { padding: 0.2 };
const PRO_OPTIONS = { hideAttribution: true };
const DEFAULT_EDGE_OPTIONS = { deletable: true };

interface OrgChartCanvasProps {
  dealId: string;
}

/** ReactFlow 内部でカーソル送受信を管理する子コンポーネント */
function RealtimeCursorManager({ dealId }: { dealId: string }) {
  const { cursors, trackCursor } = useRealtimeCursors(dealId);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleMouseMove = (e: Event) => {
      const me = e as unknown as MouseEvent;
      const pos = screenToFlowPosition({ x: me.clientX, y: me.clientY });
      trackCursor(pos.x, pos.y);
    };
    const el = document.querySelector(".react-flow");
    el?.addEventListener("mousemove", handleMouseMove);
    return () => el?.removeEventListener("mousemove", handleMouseMove);
  }, [screenToFlowPosition, trackCursor]);

  return <CursorOverlay cursors={cursors} />;
}

export function OrgChartCanvas({ dealId }: OrgChartCanvasProps) {
  const readOnly = useIsReadOnly(dealId);

  // グループ未設定の案件で、部署情報があるステークホルダーがいれば自動グループ生成
  useAutoGroupSeed(dealId);

  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const isGroupMode = orgGroups.length > 0;

  // フォールバック: グループなし→レイヤーレイアウト、グループあり→グループレイアウト
  const layerLayout = useOrgChartLayout(dealId);
  const groupLayout = useGroupChartLayout(dealId);

  const {
    nodes: layoutNodes,
    edges: layoutEdges,
    onNodeDragStop,
  } = isGroupMode ? groupLayout : layerLayout;
  // onNodeDrag/onNodeDragStartはグループモードのみ（D&Dの視覚フィードバック用）
  const onNodeDrag = isGroupMode ? groupLayout.onNodeDrag : undefined;
  const onNodeDragStart = isGroupMode ? groupLayout.onNodeDragStart : undefined;

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  const openSheet = useUiStore((s) => s.openSheet);
  const openSheetForCreate = useUiStore((s) => s.openSheetForCreate);
  const addContext = useUiStore((s) => s.addContext);
  const closeAddPopover = useUiStore((s) => s.closeAddPopover);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const addRelationship = useStakeholderStore((s) => s.addRelationship);
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );

  const [levelEditorOpen, setLevelEditorOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const groupFormOpen = useUiStore((s) => s.groupFormOpen);
  const groupFormEditId = useUiStore((s) => s.groupFormEditId);
  const groupFormParentId = useUiStore((s) => s.groupFormParentId);
  const closeGroupForm = useUiStore((s) => s.closeGroupForm);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  // ⋮メニュー「編集」用: groupFormEditIdからOrgGroupオブジェクトを取得
  const editGroupObj = groupFormEditId
    ? orgGroups.find((g) => g.id === groupFormEditId) ?? null
    : null;

  const draggingNodeId = useUiStore((s) => s.draggingNodeId);

  useEffect(() => {
    if (draggingNodeId) {
      // ドラッグ中: ドラッグ中のノード＋その子ノードの位置を維持し、それ以外を更新
      // （グループD&D時に中の人ノードが先に動くアニメーションを防止）
      setNodes((prev) => {
        const layoutMap = new Map(layoutNodes.map((n) => [n.id, n]));
        return prev.map((node) => {
          if (node.id === draggingNodeId || node.parentId === draggingNodeId) return node;
          const updated = layoutMap.get(node.id);
          return updated ?? node;
        });
      });
    } else {
      setNodes(layoutNodes);
    }
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges, draggingNodeId]);

  // Undo/Redo キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ノード接続: ドラッグでコネクタを引いたら即座にリレーションシップ作成
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const isGroupSource = connection.source.startsWith("group-");
      const isGroupTarget = connection.target.startsWith("group-");
      const sourceId = isGroupSource
        ? connection.source.replace(/^group-/, "")
        : connection.source;
      const targetId = isGroupTarget
        ? connection.target.replace(/^group-/, "")
        : connection.target;

      captureSnapshot();
      addRelationship({
        dealId,
        sourceId,
        targetId,
        type: isGroupTarget ? "oversight" : "informal",
        bidirectional: false,
        direction: "forward",
        sourceType: isGroupSource ? "group" : "stakeholder",
        targetType: isGroupTarget ? "group" : "stakeholder",
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      });
      toast.success("関係性を作成しました");
    },
    [dealId, addRelationship, captureSnapshot]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // グループノード・プレースホルダーのクリックは無視
      if (node.type === "orgGroup" || node.type === "addPersonPlaceholder") return;
      // +ボタンのポップオーバーが開いている場合はクリックを無視
      if (addContext) return;
      openSheet(node.id, "edit");
    },
    [openSheet, addContext]
  );

  const handleAddNode = useCallback(() => {
    openSheet(null, "create");
  }, [openSheet]);

  const openGroupFormForChild = useUiStore((s) => s.openGroupFormForChild);
  const handleAddGroup = useCallback(() => {
    openGroupFormForChild(null);
  }, [openGroupFormForChild]);

  // +ボタン → 「新規作成」を選択した場合
  const handleCreateFromContext = useCallback(
    (parentId: string | null, suggestedOrgLevel?: number) => {
      const context = useUiStore.getState().addContext;
      if (!context) return;

      // グループコンテキスト: groupIdをストアに設定してcreateモードで開く
      if (context.type === "group") {
        useUiStore.setState({ createGroupId: context.groupId });
        openSheetForCreate(null, null, suggestedOrgLevel);
        return;
      }

      // 新規作成 → フォームを開く（parentIdとchildToRelinkをストアに保存してから開く）
      let resolvedParentId: string | null = null;
      let childToRelink: string | null = null;

      if (context.type === "node") {
        if (context.position === "below") {
          resolvedParentId = context.nodeId;
        } else {
          const currentNode = stakeholders.find((s) => s.id === context.nodeId);
          resolvedParentId = currentNode?.parentId ?? null;
          childToRelink = context.nodeId;
        }
      } else if (context.type === "edge" || context.type === "layer") {
        resolvedParentId = context.sourceId;
        childToRelink = context.targetId;
      }

      openSheetForCreate(resolvedParentId, childToRelink, suggestedOrgLevel);
    },
    [stakeholders, openSheetForCreate]
  );

  // +ボタン → 「既存の人物を選択」した場合
  const handleSelectExisting = useCallback(
    (stakeholderId: string) => {
      const context = useUiStore.getState().addContext;
      if (!context) return;

      captureSnapshot();
      if (context.type === "node") {
        if (context.position === "below") {
          // 選択した人物をこのノードの部下に
          updateStakeholder(stakeholderId, dealId, {
            parentId: context.nodeId,
          });
        } else {
          // 選択した人物をこのノードの上司に
          const currentNode = stakeholders.find((s) => s.id === context.nodeId);
          // 選択した人物の親を、現在のノードの親に
          updateStakeholder(stakeholderId, dealId, {
            parentId: currentNode?.parentId ?? null,
          });
          // 現在のノードの親を、選択した人物に
          updateStakeholder(context.nodeId, dealId, {
            parentId: stakeholderId,
          });
        }
      } else if (context.type === "edge" || context.type === "layer") {
        // 中間者として挿入: source→選択した人物→target
        updateStakeholder(stakeholderId, dealId, {
          parentId: context.sourceId,
        });
        updateStakeholder(context.targetId, dealId, {
          parentId: stakeholderId,
        });
      }

      toast.success("人物を接続しました");
    },
    [dealId, stakeholders, updateStakeholder, captureSnapshot]
  );

  // キャンバスクリックでポップオーバーを閉じる
  const onPaneClick = useCallback(() => {
    if (addContext) {
      closeAddPopover();
    }
  }, [addContext, closeAddPopover]);

  const isEmpty = stakeholders.length === 0 && orgGroups.length === 0;

  return (
    <div className="flex-1 relative">
      {/* 空状態のオーバーレイ（ツールバーは常に表示） */}
      {isEmpty && (
        <TemplateSelector dealId={dealId} />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={readOnly ? undefined : onNodeClick}
        onNodeDragStart={readOnly ? undefined : onNodeDragStart}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        onNodeDrag={readOnly ? undefined : onNodeDrag}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        connectionLineComponent={CustomConnectionLine}
        connectionRadius={40}
        minZoom={0.1}
        maxZoom={2}
        proOptions={PRO_OPTIONS}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      >
        <RealtimeCursorManager dealId={dealId} />
        <ScrollToNewGroup />
        <PdfExportEffect dealId={dealId} />
        <OrgChartToolbar
          onAddNode={handleAddNode}
          onAddGroup={handleAddGroup}
          onOpenLevelEditor={() => setLevelEditorOpen(true)}
          onSaveTemplate={() => setSaveTemplateOpen(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          readOnly={readOnly}
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bottom-4 !right-4"
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>

      {/* +ボタンの追加メニュー */}
      <AddNodeMenu
        dealId={dealId}
        onCreateNew={handleCreateFromContext}
        onSelectExisting={handleSelectExisting}
      />

      {/* 階層設定ダイアログ */}
      <OrgLevelEditor
        dealId={dealId}
        open={levelEditorOpen}
        onOpenChange={setLevelEditorOpen}
      />

      {/* ⋮メニューから開くグループ作成/編集フォーム */}
      <OrgGroupForm
        dealId={dealId}
        open={groupFormOpen}
        onOpenChange={(open) => { if (!open) closeGroupForm(); }}
        editGroup={editGroupObj}
        defaultParentGroupId={groupFormParentId}
      />

      {/* テンプレート保存ダイアログ */}
      <SaveTemplateDialog
        dealId={dealId}
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
      />

    </div>
  );
}
