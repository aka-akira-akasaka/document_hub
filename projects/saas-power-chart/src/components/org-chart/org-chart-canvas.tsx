"use client";

import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
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
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

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
