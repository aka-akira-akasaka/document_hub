"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { computeGroupLayout, type GroupBound } from "@/lib/group-layout-engine";
import { GROUP_LAYOUT } from "@/lib/constants";
import { toast } from "sonner";

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

  // エッジ削除コールバック（relationship専用）
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      deleteRelationship(edgeId, dealId);
    },
    [dealId, deleteRelationship]
  );

  // relationshipエッジのみ描画
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
  const { layoutNodes, allEdges, groupBounds } = useMemo(() => {
    const result = computeGroupLayout(stakeholders, orgGroups, relEdges);
    return {
      layoutNodes: result.nodes,
      allEdges: result.edges,
      groupBounds: result.groupBounds,
    };
  }, [stakeholders, orgGroups, relEdges]);

  // フリーフローティングノードは保存済み位置を優先
  // グループ内stakeholderはレイアウト計算の絶対座標を使用
  const nodes: Node[] = useMemo(() =>
    layoutNodes.map((n) => {
      // グループノードはレイアウト結果をそのまま使用
      if (n.type === "orgGroup") return n;
      // stakeholderノード: groupIdがあればレイアウト位置、なければ保存位置を優先
      const s = stakeholders.find((st) => st.id === n.id);
      if (s?.groupId) {
        // グループ所属: レイアウトエンジンの絶対座標をそのまま使用
        return n;
      }
      // フリーフローティング: 保存済み位置があればそちらを優先
      return {
        ...n,
        position: s?.position ?? n.position,
      };
    }),
    [layoutNodes, stakeholders]
  );

  /**
   * ドロップ先のグループを検出
   * ノードの中心座標がグループBBox内にあるか判定
   * 最も深い（最内側の）グループを返す
   */
  const findDropTargetGroup = useCallback(
    (nodePosition: { x: number; y: number }): string | null => {
      const cx = nodePosition.x + GROUP_LAYOUT.nodeWidth / 2;
      const cy = nodePosition.y + GROUP_LAYOUT.nodeHeight / 2;

      // 全グループの中から、ノード中心を含むものをフィルタ
      const candidates: GroupBound[] = groupBounds.filter(
        (gb) =>
          cx >= gb.x &&
          cx <= gb.x + gb.width &&
          cy >= gb.y &&
          cy <= gb.y + gb.height
      );

      if (candidates.length === 0) return null;

      // 最も面積が小さいグループ（最内側）を選択
      let smallest = candidates[0];
      for (const c of candidates) {
        if (c.width * c.height < smallest.width * smallest.height) {
          smallest = c;
        }
      }
      return smallest.groupId;
    },
    [groupBounds]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // グループノードのドラッグは位置保存しない（レイアウトで自動計算）
      if (node.type === "orgGroup") return;

      // ドロップ先のグループを検出
      const targetGroupId = findDropTargetGroup(node.position);
      const s = stakeholders.find((st) => st.id === node.id);
      const currentGroupId = s?.groupId ?? null;

      if (targetGroupId !== currentGroupId) {
        // グループが変わった: groupIdを更新（レイアウトが再計算される）
        updateStakeholder(node.id, dealId, { groupId: targetGroupId });
        const targetGroup = orgGroups.find((g) => g.id === targetGroupId);
        if (targetGroupId) {
          toast.success(`${s?.name ?? ""} を ${targetGroup?.name ?? ""}に移動しました`);
        } else {
          toast.success(`${s?.name ?? ""} をフリーに移動しました`);
        }
      } else if (!targetGroupId) {
        // フリーフローティングのまま: 位置を保存
        updateNodePosition(node.id, dealId, node.position);
      }
      // グループ内でのドラッグ完了→何もしない（レイアウトで自動配置されるため）
    },
    [dealId, stakeholders, orgGroups, findDropTargetGroup, updateStakeholder, updateNodePosition]
  );

  // 自動レイアウト: 全フリーフローティングノードの位置をリセット
  const applyAutoLayout = useCallback(() => {
    const result = computeGroupLayout(stakeholders, orgGroups, relEdges);
    for (const n of result.nodes) {
      if (n.type !== "orgGroup") {
        const s = stakeholders.find((st) => st.id === n.id);
        // フリーフローティングのみ位置を保存
        if (!s?.groupId) {
          updateNodePosition(n.id, dealId, n.position);
        }
      }
    }
  }, [stakeholders, orgGroups, relEdges, dealId, updateNodePosition]);

  return { nodes, edges: allEdges, onNodeDragStop, applyAutoLayout };
}
