"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StakeholderNode } from "./stakeholder-node";
import { RelationshipEdge } from "./relationship-edge";
import { OrgGroupNode } from "./org-group-node";
import { AddPersonPlaceholderNode } from "./add-person-placeholder-node";
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

const EMPTY: Stakeholder[] = [];
const EMPTY_GROUPS: import("@/types/org-group").OrgGroup[] = [];

const nodeTypes = { stakeholder: StakeholderNode, orgGroup: OrgGroupNode, addPersonPlaceholder: AddPersonPlaceholderNode };
const edgeTypes = { relationship: RelationshipEdge };

// ReactFlowに渡すオプションをモジュールレベルで定義（毎レンダー新オブジェクト生成による無限ループ防止）
const FIT_VIEW_OPTIONS = { padding: 0.2 };
const PRO_OPTIONS = { hideAttribution: true };
const DEFAULT_EDGE_OPTIONS = { deletable: true };

interface OrgChartCanvasProps {
  dealId: string;
}

export function OrgChartCanvas({ dealId }: OrgChartCanvasProps) {
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
    applyAutoLayout,
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
      // ドラッグ中: ドラッグ中のノードの位置はマウス追従を維持し、それ以外を更新
      setNodes((prev) => {
        const layoutMap = new Map(layoutNodes.map((n) => [n.id, n]));
        return prev.map((node) => {
          if (node.id === draggingNodeId) return node;
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
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        connectionRadius={40}
        minZoom={0.1}
        maxZoom={2}
        proOptions={PRO_OPTIONS}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      >
        {/* LayerBackground は廃止済み — グループモードに統一 */}
        <OrgChartToolbar
          onAutoLayout={applyAutoLayout}
          onAddNode={handleAddNode}
          onAddGroup={handleAddGroup}
          onOpenLevelEditor={() => setLevelEditorOpen(true)}
          onSaveTemplate={() => setSaveTemplateOpen(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
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
