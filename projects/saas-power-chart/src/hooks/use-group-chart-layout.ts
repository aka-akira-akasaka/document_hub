"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { computeGroupLayout } from "@/lib/group-layout-engine";
import type { RelationshipType } from "@/types/relationship";

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
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const deleteRelationship = useStakeholderStore((s) => s.deleteRelationship);

  // エッジ削除コールバック
  const handleEdgeDelete = useCallback(
    (edgeId: string, _source: string, target: string, relType: RelationshipType) => {
      if (relType === "reporting") {
        updateStakeholder(target, dealId, { parentId: null });
      } else {
        deleteRelationship(edgeId, dealId);
      }
    },
    [dealId, updateStakeholder, deleteRelationship]
  );

  // reportingエッジの生成
  const reportingEdges: Edge[] = useMemo(() =>
    stakeholders
      .filter((s) => s.parentId)
      .map((s) => ({
        id: `org-${s.parentId}-${s.id}`,
        source: s.parentId!,
        target: s.id,
        type: "relationship",
        data: { type: "reporting", onDelete: handleEdgeDelete },
      })),
    [stakeholders, handleEdgeDelete]
  );

  // relationship（非reporting）エッジ
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
    const allReportingAndRelEdges = [...reportingEdges, ...relEdges];
    const result = computeGroupLayout(stakeholders, orgGroups, allReportingAndRelEdges);
    return {
      layoutNodes: result.nodes,
      allEdges: result.edges,
    };
  }, [stakeholders, orgGroups, reportingEdges, relEdges]);

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
    const result = computeGroupLayout(stakeholders, orgGroups, [...reportingEdges, ...relEdges]);
    for (const n of result.nodes) {
      if (n.type !== "orgGroup" && !n.parentId) {
        updateNodePosition(n.id, dealId, n.position);
      }
    }
  }, [stakeholders, orgGroups, reportingEdges, relEdges, dealId, updateNodePosition]);

  return { nodes, edges: allEdges, onNodeDragStop, applyAutoLayout };
}
