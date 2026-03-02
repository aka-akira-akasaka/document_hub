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
import { OrgChartToolbar } from "./org-chart-toolbar";
import { AddNodeMenu } from "./add-node-menu";
import { OrgLevelEditor } from "./org-level-editor";
import { useOrgChartLayout } from "@/hooks/use-org-chart-layout";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { EmptyState } from "@/components/layout/empty-state";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Stakeholder } from "@/types/stakeholder";
import { toast } from "sonner";

const EMPTY: Stakeholder[] = [];

const nodeTypes = { stakeholder: StakeholderNode };
const edgeTypes = { relationship: RelationshipEdge };

interface OrgChartCanvasProps {
  dealId: string;
}

export function OrgChartCanvas({ dealId }: OrgChartCanvasProps) {
  const {
    nodes: layoutNodes,
    edges: layoutEdges,
    onNodeDragStop,
    applyAutoLayout,
  } = useOrgChartLayout(dealId);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  const openSheet = useUiStore((s) => s.openSheet);
  const openSheetForCreate = useUiStore((s) => s.openSheetForCreate);
  const addContext = useUiStore((s) => s.addContext);
  const closeAddPopover = useUiStore((s) => s.closeAddPopover);
  const addStakeholder = useStakeholderStore((s) => s.addStakeholder);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );

  const [levelEditorOpen, setLevelEditorOpen] = useState(false);
  const autoLayoutApplied = useRef(false);

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

  // ノード接続: ドラッグで上下関係（parentId）を設定
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      // 循環参照チェック: source が target の子孫でないことを確認
      const isDescendant = (parentId: string, targetId: string): boolean => {
        let current = stakeholders.find((s) => s.id === parentId);
        while (current?.parentId) {
          if (current.parentId === targetId) return true;
          current = stakeholders.find((s) => s.id === current!.parentId);
        }
        return false;
      };

      if (isDescendant(connection.source, connection.target)) return;

      // 接続元を上司、接続先を部下とする上下関係を作成
      updateStakeholder(connection.target, dealId, {
        parentId: connection.source,
      });
      toast.success("つながりを作成しました");
    },
    [dealId, stakeholders, updateStakeholder]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
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
    (parentId: string | null, isUnknown?: boolean, suggestedOrgLevel?: number) => {
      const context = useUiStore.getState().addContext;
      if (!context) return;

      if (isUnknown) {
        // 不明人物を即座に追加
        let resolvedParentId = parentId;
        let childToRelink: string | null = null;

        if (context.type === "edge") {
          resolvedParentId = context.sourceId;
          childToRelink = context.targetId;
        } else if (context.type === "node" && context.position === "above") {
          // 上司として追加: 現在のノードの親を新ノードの親に、現在のノードの親を新ノードに
          const currentNode = stakeholders.find((s) => s.id === context.nodeId);
          resolvedParentId = currentNode?.parentId ?? null;
          childToRelink = context.nodeId;
        }

        const newStakeholder = addStakeholder({
          dealId,
          name: "不明",
          department: "",
          title: "",
          roleInDeal: "unknown",
          influenceLevel: 3,
          attitude: "neutral",
          mission: "",
          relationshipOwner: "",
          parentId: resolvedParentId,
          email: "",
          phone: "",
          notes: "",
          isUnknown: true,
        });

        // エッジ中間 or 上司追加の場合、元の子を新ノードの下に付け替え
        if (childToRelink) {
          updateStakeholder(childToRelink, dealId, {
            parentId: newStakeholder.id,
          });
        }

        toast.success("不明人物を追加しました");
        // 追加後すぐに編集ダイアログを開く
        openSheet(newStakeholder.id, "edit");
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
      } else if (context.type === "edge") {
        resolvedParentId = context.sourceId;
        childToRelink = context.targetId;
      }

      openSheetForCreate(resolvedParentId, childToRelink, suggestedOrgLevel);
    },
    [dealId, stakeholders, addStakeholder, updateStakeholder, openSheet, openSheetForCreate]
  );

  // +ボタン → 「既存の人物を選択」した場合
  const handleSelectExisting = useCallback(
    (stakeholderId: string) => {
      const context = useUiStore.getState().addContext;
      if (!context) return;

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
      } else if (context.type === "edge") {
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
    [dealId, stakeholders, updateStakeholder]
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
        <OrgChartToolbar
          onAutoLayout={applyAutoLayout}
          onAddNode={handleAddNode}
          onOpenLevelEditor={() => setLevelEditorOpen(true)}
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
    </div>
  );
}
