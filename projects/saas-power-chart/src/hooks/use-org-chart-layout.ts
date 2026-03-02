"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { getLayerLayout } from "@/lib/layout-engine";
import { DEFAULT_ORG_LEVELS } from "@/lib/constants";
import type { RelationshipType } from "@/types/relationship";

const EMPTY_S: import("@/types/stakeholder").Stakeholder[] = [];
const EMPTY_R: import("@/types/relationship").Relationship[] = [];

export function useOrgChartLayout(dealId: string) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const relationships = useStakeholderStore((s) =>
    s.relationshipsByDeal[dealId] ?? EMPTY_R
  );
  const orgLevelConfig = useStakeholderStore((s) =>
    s.orgLevelConfigByDeal[dealId]
  );
  const updateNodePosition = useStakeholderStore((s) => s.updateNodePosition);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const deleteRelationship = useStakeholderStore((s) => s.deleteRelationship);

  const orgLevels = orgLevelConfig && orgLevelConfig.length > 0
    ? orgLevelConfig
    : DEFAULT_ORG_LEVELS;

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

  // レイヤーベースレイアウト計算
  const { layoutNodes, layers, passthroughByEdge } = useMemo(() => {
    const result = getLayerLayout(stakeholders, orgLevels, reportingEdges);
    return {
      layoutNodes: result.nodes,
      layers: result.layers,
      passthroughByEdge: result.passthroughByEdge,
    };
  }, [stakeholders, orgLevels, reportingEdges]);

  // position保存済みならそちらを優先、未保存ならレイアウト計算結果を使用
  const nodes: Node[] = useMemo(() =>
    layoutNodes.map((n) => {
      const s = stakeholders.find((st) => st.id === n.id);
      return {
        ...n,
        position: s?.position ?? n.position,
      };
    }),
    [layoutNodes, stakeholders]
  );

  // reportingエッジにpassthroughLayersを付与 + その他のrelationshipエッジ
  const edges: Edge[] = useMemo(() => {
    const orgEdges: Edge[] = reportingEdges.map((e) => ({
      ...e,
      data: {
        ...e.data,
        passthroughLayers: passthroughByEdge.get(e.id) ?? [],
      },
    }));

    const relEdges: Edge[] = relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: "relationship",
      data: { type: r.type, label: r.label, onDelete: handleEdgeDelete },
    }));

    return [...orgEdges, ...relEdges];
  }, [reportingEdges, relationships, handleEdgeDelete, passthroughByEdge]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, dealId, node.position);
    },
    [dealId, updateNodePosition]
  );

  // 自動レイアウト: レイヤー計算結果を全ノードに適用
  const applyAutoLayout = useCallback(() => {
    const result = getLayerLayout(stakeholders, orgLevels, reportingEdges);
    result.nodes.forEach((n) => {
      updateNodePosition(n.id, dealId, n.position);
    });
  }, [stakeholders, orgLevels, reportingEdges, dealId, updateNodePosition]);

  return { nodes, edges, layers, onNodeDragStop, applyAutoLayout };
}
