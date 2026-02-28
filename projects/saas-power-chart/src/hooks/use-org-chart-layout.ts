"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { getLayoutedElements } from "@/lib/layout-engine";

const EMPTY_S: import("@/types/stakeholder").Stakeholder[] = [];
const EMPTY_R: import("@/types/relationship").Relationship[] = [];

export function useOrgChartLayout(dealId: string) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const relationships = useStakeholderStore((s) =>
    s.relationshipsByDeal[dealId] ?? EMPTY_R
  );
  const updateNodePosition = useStakeholderStore((s) => s.updateNodePosition);

  const nodes: Node[] = useMemo(
    () =>
      stakeholders.map((s) => ({
        id: s.id,
        type: "stakeholder",
        position: s.position ?? { x: 0, y: 0 },
        data: { ...s },
      })),
    [stakeholders]
  );

  const edges: Edge[] = useMemo(() => {
    const orgEdges: Edge[] = stakeholders
      .filter((s) => s.parentId)
      .map((s) => ({
        id: `org-${s.parentId}-${s.id}`,
        source: s.parentId!,
        target: s.id,
        type: "relationship",
        data: { type: "reporting" },
      }));

    const relEdges: Edge[] = relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: "relationship",
      data: { type: r.type, label: r.label },
    }));

    return [...orgEdges, ...relEdges];
  }, [stakeholders, relationships]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, dealId, node.position);
    },
    [dealId, updateNodePosition]
  );

  const applyAutoLayout = useCallback(() => {
    const reportingEdges = edges.filter(
      (e) => (e.data as Record<string, unknown>)?.type === "reporting"
    );
    const { nodes: layoutedNodes } = getLayoutedElements(
      nodes,
      reportingEdges
    );
    layoutedNodes.forEach((n) => {
      updateNodePosition(n.id, dealId, n.position);
    });
  }, [nodes, edges, dealId, updateNodePosition]);

  return { nodes, edges, onNodeDragStop, applyAutoLayout };
}
