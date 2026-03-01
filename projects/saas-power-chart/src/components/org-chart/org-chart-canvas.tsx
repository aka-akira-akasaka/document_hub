"use client";

import { useCallback, useEffect, useRef } from "react";
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
import { useOrgChartLayout } from "@/hooks/use-org-chart-layout";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { EmptyState } from "@/components/layout/empty-state";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Stakeholder } from "@/types/stakeholder";

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
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );

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
    },
    [dealId, stakeholders, updateStakeholder]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      openSheet(node.id, "view");
    },
    [openSheet]
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      openSheet(node.id, "edit");
    },
    [openSheet]
  );

  const handleAddNode = useCallback(() => {
    openSheet(null, "create");
  }, [openSheet]);

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
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <OrgChartToolbar
          onAutoLayout={applyAutoLayout}
          onAddNode={handleAddNode}
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bottom-4 !right-4"
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
