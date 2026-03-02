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

/**
 * ノードの絶対座標を算出（parent chain を辿る）
 */
function getAbsolutePosition(
  node: Node,
  nodeMap: Map<string, Node>
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let current = node.parentId ? nodeMap.get(node.parentId) : undefined;
  while (current) {
    x += current.position.x;
    y += current.position.y;
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }
  return { x, y };
}

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

  // relationshipエッジを描画（targetTypeに応じてtarget IDを変換）
  const relEdges: Edge[] = useMemo(() =>
    relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetType === "group" ? `group-${r.targetId}` : r.targetId,
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
  // グループ内stakeholderはレイアウト計算の相対座標を使用
  const nodes: Node[] = useMemo(() =>
    layoutNodes.map((n) => {
      // グループノードはレイアウト結果をそのまま使用
      if (n.type === "orgGroup") return n;
      // stakeholderノード: groupIdがあればレイアウト位置（相対座標）、なければ保存位置を優先
      const s = stakeholders.find((st) => st.id === n.id);
      if (s?.groupId) {
        // グループ所属: レイアウトエンジンの相対座標をそのまま使用
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
   * ノードの絶対中心座標がグループBBox内にあるか判定
   * 最も深い（最内側の）グループを返す
   */
  const findDropTargetGroup = useCallback(
    (absolutePosition: { x: number; y: number }): string | null => {
      const cx = absolutePosition.x + GROUP_LAYOUT.nodeWidth / 2;
      const cy = absolutePosition.y + GROUP_LAYOUT.nodeHeight / 2;

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
    (_event: React.MouseEvent, node: Node, allNodes: Node[]) => {
      // グループノードのドラッグ: 子が自動追従するので何もしない
      if (node.type === "orgGroup") return;

      // ノードの絶対座標を算出（parentId chain を辿る）
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
      const absPos = getAbsolutePosition(node, nodeMap);

      // ドロップ先のグループを検出（絶対座標ベース）
      const targetGroupId = findDropTargetGroup(absPos);
      const s = stakeholders.find((st) => st.id === node.id);
      const currentGroupId = s?.groupId ?? null;

      if (targetGroupId !== currentGroupId) {
        // グループが変わった: groupIdとdepartmentを更新（レイアウトが再計算される）
        const targetGroup = orgGroups.find((g) => g.id === targetGroupId);
        const updates: Partial<import("@/types/stakeholder").Stakeholder> = {
          groupId: targetGroupId,
        };
        // グループに移動した場合はdepartmentも自動更新
        if (targetGroupId && targetGroup) {
          updates.department = targetGroup.name;
        }
        updateStakeholder(node.id, dealId, updates);
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
