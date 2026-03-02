"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { OrgChartToolbar } from "./org-chart-toolbar";
import { AddNodeMenu } from "./add-node-menu";
import { OrgLevelEditor } from "./org-level-editor";
import { OrgGroupManager } from "./org-group-manager";
import { OrgGroupForm } from "./org-group-form";
import { ConnectionTypeDialog } from "./connection-type-dialog";
import { LayerBackground } from "./layer-background";
import { useOrgChartLayout } from "@/hooks/use-org-chart-layout";
import { useGroupChartLayout } from "@/hooks/use-group-chart-layout";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useHistoryStore } from "@/stores/history-store";
import { EmptyState } from "@/components/layout/empty-state";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Stakeholder } from "@/types/stakeholder";
import type { RelationshipType } from "@/types/relationship";
import { toast } from "sonner";

const EMPTY: Stakeholder[] = [];

const nodeTypes = { stakeholder: StakeholderNode, orgGroup: OrgGroupNode };
const edgeTypes = { relationship: RelationshipEdge };

interface OrgChartCanvasProps {
  dealId: string;
}

export function OrgChartCanvas({ dealId }: OrgChartCanvasProps) {
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? []);
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
  const layers = isGroupMode ? [] : (layerLayout.layers ?? []);

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
  const groupManagerOpen = useUiStore((s) => s.groupManagerOpen);
  const openGroupManager = useUiStore((s) => s.openGroupManager);
  const closeGroupManager = useUiStore((s) => s.closeGroupManager);
  const groupFormOpen = useUiStore((s) => s.groupFormOpen);
  const groupFormEditId = useUiStore((s) => s.groupFormEditId);
  const groupFormParentId = useUiStore((s) => s.groupFormParentId);
  const closeGroupForm = useUiStore((s) => s.closeGroupForm);
  const pendingConnection = useUiStore((s) => s.pendingConnection);
  const setPendingConnection = useUiStore((s) => s.setPendingConnection);
  const clearPendingConnection = useUiStore((s) => s.clearPendingConnection);
  const autoLayoutApplied = useRef(false);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo());
  const canRedo = useHistoryStore((s) => s.canRedo());

  // ⋮メニュー「編集」用: groupFormEditIdからOrgGroupオブジェクトを取得
  const editGroupObj = groupFormEditId
    ? orgGroups.find((g) => g.id === groupFormEditId) ?? null
    : null;

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // positionが未設定のノードばかりの場合、初回のみ自動レイアウトを適用
  useEffect(() => {
    if (autoLayoutApplied.current) return;
    if (stakeholders.length === 0) return;
    const allUnpositioned = stakeholders.every((s) => !s.position);
    if (allUnpositioned) {
      autoLayoutApplied.current = true;
      applyAutoLayout();
    }
  }, [stakeholders, applyAutoLayout]);

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

  // ノード接続: ドラッグでコネクタを引いた後、タイプ選択ダイアログを開く
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      // 接続先がグループノードか判定
      const isGroupTarget = connection.target.startsWith("group-");
      const targetId = isGroupTarget
        ? connection.target.replace(/^group-/, "")
        : connection.target;

      setPendingConnection({
        sourceId: connection.source,
        targetId,
        targetType: isGroupTarget ? "group" : "stakeholder",
      });
    },
    [setPendingConnection]
  );

  // 接続タイプダイアログで確定
  const handleConnectionConfirm = useCallback(
    (type: RelationshipType, label: string, bidirectional: boolean) => {
      const conn = useUiStore.getState().pendingConnection;
      if (!conn) return;

      captureSnapshot();
      addRelationship({
        dealId,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        type,
        label: label || undefined,
        bidirectional,
        targetType: conn.targetType,
      });
      toast.success("関係性を作成しました");
      clearPendingConnection();
    },
    [dealId, addRelationship, clearPendingConnection, captureSnapshot]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // グループノードのクリックは無視
      if (node.type === "orgGroup") return;
      // +ボタンのポップオーバーが開いている場合はクリックを無視
      if (addContext) return;
      openSheet(node.id, "edit");
    },
    [openSheet, addContext]
  );

  const handleAddNode = useCallback(() => {
    openSheet(null, "create");
  }, [openSheet]);

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

  if (stakeholders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="ステークホルダーがいません"
          description="人物を追加するか、CSVをインポートしてパワーチャートを作成しましょう。"
          action={
            <Button onClick={handleAddNode}>ステークホルダーを追加</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ deletable: true }}
      >
        {layers.length > 0 && <LayerBackground layers={layers} />}
        <OrgChartToolbar
          onAutoLayout={applyAutoLayout}
          onAddNode={handleAddNode}
          onOpenLevelEditor={() => setLevelEditorOpen(true)}
          onOpenGroupManager={openGroupManager}
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

      {/* 部門グループ管理パネル */}
      <OrgGroupManager
        dealId={dealId}
        open={groupManagerOpen}
        onOpenChange={closeGroupManager}
      />

      {/* ⋮メニューから開くグループ作成/編集フォーム */}
      <OrgGroupForm
        dealId={dealId}
        open={groupFormOpen}
        onOpenChange={(open) => { if (!open) closeGroupForm(); }}
        editGroup={editGroupObj}
        defaultParentGroupId={groupFormParentId}
      />

      {/* コネクタ接続後のタイプ選択ダイアログ */}
      <ConnectionTypeDialog
        open={!!pendingConnection}
        targetType={pendingConnection?.targetType ?? "stakeholder"}
        onConfirm={handleConnectionConfirm}
        onCancel={clearPendingConnection}
      />

      {/* 部課のリストを開くトグル */}
      {isGroupMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            onClick={openGroupManager}
          >
            部課のリストを開く ▽
          </button>
        </div>
      )}
    </div>
  );
}
