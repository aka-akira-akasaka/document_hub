"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useUiStore } from "@/stores/ui-store";
import { computeGroupLayout, type GroupBound } from "@/lib/group-layout-engine";
import { GROUP_LAYOUT } from "@/lib/constants";
import { assignHandlesToEdges } from "@/lib/handle-utils";
import { useHistoryStore } from "@/stores/history-store";
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
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);

  // エッジ削除コールバック（relationship専用）
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      captureSnapshot();
      deleteRelationship(edgeId, dealId);
    },
    [dealId, deleteRelationship, captureSnapshot]
  );

  // relationshipエッジを描画（targetTypeに応じてtarget IDを変換）
  const relEdges: Edge[] = useMemo(() =>
    relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetType === "group" ? `group-${r.targetId}` : r.targetId,
      type: "relationship",
      zIndex: 1000,
      data: { type: r.type, label: r.label, onDelete: handleEdgeDelete },
    })),
    [relationships, handleEdgeDelete]
  );

  // グループベースレイアウト計算
  const groupBoundsRef = useRef<GroupBound[]>([]);

  const { layoutNodes, allEdges } = useMemo(() => {
    const result = computeGroupLayout(stakeholders, orgGroups, relEdges);
    // レイアウト済みノード位置に基づいて最近接ハンドルを自動選択
    const edgesWithHandles = assignHandlesToEdges(result.edges, result.nodes);
    // groupBoundsをRefに保存（コールバック内で参照するため）
    groupBoundsRef.current = result.groupBounds;
    return {
      layoutNodes: result.nodes,
      allEdges: edgesWithHandles,
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
   * ドラッグ中のノードの絶対座標を算出
   * ReactFlowのコールバック第3引数にはドラッグ中のノードのみが含まれるため、
   * 親グループの座標はgroupBoundsRefから取得する。
   */
  const getNodeAbsolutePosition = useCallback(
    (node: Node): { x: number; y: number } => {
      let absX = node.position.x;
      let absY = node.position.y;

      if (node.parentId) {
        // parentIdは "group-xxx" 形式 → groupBoundsから親グループの絶対座標を取得
        const parentGroupId = node.parentId.replace(/^group-/, "");
        const parentBound = groupBoundsRef.current.find(
          (gb) => gb.groupId === parentGroupId
        );
        if (parentBound) {
          absX += parentBound.x;
          absY += parentBound.y;
        }
      }

      return { x: absX, y: absY };
    },
    []
  );

  /**
   * ドロップ先のグループを検出
   * groupBoundsRef（レイアウト計算済みの絶対座標・サイズ）から判定。
   * ReactFlowコールバックの第3引数に全ノードが含まれない問題を回避。
   */
  const findDropTargetGroup = useCallback(
    (absolutePosition: { x: number; y: number }): string | null => {
      const cx = absolutePosition.x + GROUP_LAYOUT.nodeWidth / 2;
      const cy = absolutePosition.y + GROUP_LAYOUT.nodeHeight / 2;

      const candidates: { groupId: string; area: number }[] = [];
      for (const gb of groupBoundsRef.current) {
        if (
          cx >= gb.x &&
          cx <= gb.x + gb.width &&
          cy >= gb.y &&
          cy <= gb.y + gb.height
        ) {
          candidates.push({ groupId: gb.groupId, area: gb.width * gb.height });
        }
      }

      if (candidates.length === 0) return null;

      // 最も面積が小さいグループ（最内側）を選択
      candidates.sort((a, b) => a.area - b.area);
      return candidates[0].groupId;
    },
    []
  );

  // D&D中のリアルタイムフィードバック
  const setDragOverGroupId = useUiStore((s) => s.setDragOverGroupId);

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "orgGroup" || node.type === "addPersonPlaceholder") {
        setDragOverGroupId(null);
        return;
      }
      const absPos = getNodeAbsolutePosition(node);
      const targetGroupId = findDropTargetGroup(absPos);
      setDragOverGroupId(targetGroupId);
    },
    [getNodeAbsolutePosition, findDropTargetGroup, setDragOverGroupId]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // ドラッグオーバー状態をリセット
      setDragOverGroupId(null);

      // グループノード・プレースホルダーのドラッグは無視
      if (node.type === "orgGroup" || node.type === "addPersonPlaceholder") return;

      // ノードの絶対座標を算出（groupBoundsRefベース）
      const absPos = getNodeAbsolutePosition(node);

      // ドロップ先のグループを検出
      const targetGroupId = findDropTargetGroup(absPos);
      const s = stakeholders.find((st) => st.id === node.id);
      const currentGroupId = s?.groupId ?? null;

      if (targetGroupId !== currentGroupId) {
        // グループが変わった: groupIdとdepartmentを更新（レイアウトが再計算される）
        captureSnapshot();
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
    [dealId, stakeholders, orgGroups, getNodeAbsolutePosition, findDropTargetGroup, updateStakeholder, updateNodePosition, captureSnapshot, setDragOverGroupId]
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

  return { nodes, edges: allEdges, onNodeDragStop, onNodeDrag, applyAutoLayout };
}
