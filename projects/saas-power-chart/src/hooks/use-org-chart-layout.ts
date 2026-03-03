"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { getLayerLayout } from "@/lib/layout-engine";
import { DEFAULT_ORG_LEVELS } from "@/lib/constants";
import { assignHandlesToEdges } from "@/lib/handle-utils";

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
  const deleteRelationship = useStakeholderStore((s) => s.deleteRelationship);
  const updateRelationship = useStakeholderStore((s) => s.updateRelationship);

  const orgLevels = orgLevelConfig && orgLevelConfig.length > 0
    ? orgLevelConfig
    : DEFAULT_ORG_LEVELS;

  // エッジ削除コールバック（relationship専用、reportingエッジは描画しない）
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      deleteRelationship(edgeId, dealId);
    },
    [dealId, deleteRelationship]
  );

  // エッジ更新コールバック
  const handleEdgeUpdate = useCallback(
    (edgeId: string, data: { label?: string }) => {
      updateRelationship(edgeId, dealId, data);
    },
    [dealId, updateRelationship]
  );

  // レイヤーベースレイアウト計算（reportingエッジなし）
  const { layoutNodes, layers } = useMemo(() => {
    const result = getLayerLayout(stakeholders, orgLevels, []);
    return {
      layoutNodes: result.nodes,
      layers: result.layers,
    };
  }, [stakeholders, orgLevels]);

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

  // relationship（非reporting）エッジのみ描画（最近接ハンドル自動選択付き）
  const edges: Edge[] = useMemo(() => {
    const baseEdges = relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: "relationship",
      zIndex: 1000,
      data: { type: r.type, label: r.label, direction: r.direction ?? (r.bidirectional ? "bidirectional" : "forward"), color: r.color, onDelete: handleEdgeDelete, onUpdate: handleEdgeUpdate },
    }));
    return assignHandlesToEdges(baseEdges, nodes);
  }, [relationships, handleEdgeDelete, handleEdgeUpdate, nodes]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, dealId, node.position);
    },
    [dealId, updateNodePosition]
  );

  // 自動レイアウト: レイヤー計算結果を全ノードに適用
  const applyAutoLayout = useCallback(() => {
    const result = getLayerLayout(stakeholders, orgLevels, []);
    result.nodes.forEach((n) => {
      updateNodePosition(n.id, dealId, n.position);
    });
  }, [stakeholders, orgLevels, dealId, updateNodePosition]);

  return { nodes, edges, layers, onNodeDragStop, applyAutoLayout };
}
