"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { computeGroupLayout } from "@/lib/group-layout-engine";

const EMPTY_S: import("@/types/stakeholder").Stakeholder[] = [];
const EMPTY_R: import("@/types/relationship").Relationship[] = [];

export function useGroupChartLayout(dealId: string) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const relationships = useStakeholderStore((s) =>
    s.relationshipsByDeal[dealId] ?? EMPTY_R
  );
  const orgGroups = useOrgGroupStore((s) =>
    s.groupsByDeal[dealId] ?? []
  );
  const updateNodePosition = useStakeholderStore((s) => s.updateNodePosition);
  const deleteRelationship = useStakeholderStore((s) => s.deleteRelationship);

  // エッジ削除コールバック（relationship専用、reportingエッジは描画しない）
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      deleteRelationship(edgeId, dealId);
    },
    [dealId, deleteRelationship]
  );

  // relationship（非reporting）エッジのみ描画
  const relEdges: Edge[] = useMemo(() =>
    relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: "relationship",
      data: { type: r.type, label: r.label, onDelete: handleEdgeDelete },
    })),
    [relationships, handleEdgeDelete]
  );

  // グループベースレイアウト計算
  const { layoutNodes, allEdges } = useMemo(() => {
    const result = computeGroupLayout(stakeholders, orgGroups, relEdges);
    return {
      layoutNodes: result.nodes,
      allEdges: result.edges,
    };
  }, [stakeholders, orgGroups, relEdges]);

  // position保存済みならそちらを優先（フリーフローティングノードのみ）
  const nodes: Node[] = useMemo(() =>
    layoutNodes.map((n) => {
      // グループノードはレイアウト結果をそのまま使用
      if (n.type === "orgGroup") return n;
      // グループ内のstakeholderはレイアウト結果をそのまま使用（相対座標）
      if (n.parentId) return n;
      // フリーフローティングのstakeholderは保存済み位置を優先
      const s = stakeholders.find((st) => st.id === n.id);
      return {
        ...n,
        position: s?.position ?? n.position,
      };
    }),
    [layoutNodes, stakeholders]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // グループノードのドラッグは位置保存しない（レイアウトで自動計算）
      if (node.type === "orgGroup") return;
      // グループ内のstakeholderも位置保存しない
      if (node.parentId) return;
      updateNodePosition(node.id, dealId, node.position);
    },
    [dealId, updateNodePosition]
  );

  // 自動レイアウト: 全フリーフローティングノードの位置をリセット
  const applyAutoLayout = useCallback(() => {
    const result = computeGroupLayout(stakeholders, orgGroups, relEdges);
    for (const n of result.nodes) {
      if (n.type !== "orgGroup" && !n.parentId) {
        updateNodePosition(n.id, dealId, n.position);
      }
    }
  }, [stakeholders, orgGroups, relEdges, dealId, updateNodePosition]);

  return { nodes, edges: allEdges, onNodeDragStop, applyAutoLayout };
}
