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
const EMPTY_G: import("@/types/org-group").OrgGroup[] = [];

export function useGroupChartLayout(dealId: string) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY_S
  );
  const relationships = useStakeholderStore((s) =>
    s.relationshipsByDeal[dealId] ?? EMPTY_R
  );
  const orgGroups = useOrgGroupStore((s) =>
    s.groupsByDeal[dealId] ?? EMPTY_G
  );
  const updateNodePosition = useStakeholderStore((s) => s.updateNodePosition);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const deleteRelationship = useStakeholderStore((s) => s.deleteRelationship);
  const updateRelationship = useStakeholderStore((s) => s.updateRelationship);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);

  // エッジ削除コールバック（relationship専用）
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      captureSnapshot();
      deleteRelationship(edgeId, dealId);
    },
    [dealId, deleteRelationship, captureSnapshot]
  );

  // エッジ更新コールバック
  const handleEdgeUpdate = useCallback(
    (edgeId: string, data: { label?: string }) => {
      captureSnapshot();
      updateRelationship(edgeId, dealId, data);
    },
    [dealId, updateRelationship, captureSnapshot]
  );

  // relationshipエッジを描画（targetTypeに応じてtarget IDを変換）
  const relEdges: Edge[] = useMemo(() =>
    relationships.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetType === "group" ? `group-${r.targetId}` : r.targetId,
      type: "relationship",
      zIndex: 1000,
      ...(r.sourceHandle ? { sourceHandle: r.sourceHandle } : {}),
      ...(r.targetHandle ? { targetHandle: r.targetHandle } : {}),
      data: { type: r.type, label: r.label, targetType: r.targetType, direction: r.direction ?? (r.bidirectional ? "bidirectional" : "forward"), color: r.color, onDelete: handleEdgeDelete, onUpdate: handleEdgeUpdate },
    })),
    [relationships, handleEdgeDelete, handleEdgeUpdate]
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
    (absolutePosition: { x: number; y: number }, excludeGroupId?: string): string | null => {
      const cx = absolutePosition.x + GROUP_LAYOUT.nodeWidth / 2;
      const cy = absolutePosition.y + GROUP_LAYOUT.nodeHeight / 2;

      // グループD&D時: 自分自身と子孫を除外（循環参照防止）
      const excludeIds = new Set<string>();
      if (excludeGroupId) {
        excludeIds.add(excludeGroupId);
        const descendants = useOrgGroupStore.getState().getDescendantIds(excludeGroupId, dealId);
        for (const id of descendants) excludeIds.add(id);
      }

      const candidates: { groupId: string; area: number }[] = [];
      for (const gb of groupBoundsRef.current) {
        if (excludeIds.has(gb.groupId)) continue;
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
    [dealId]
  );

  // D&D中のリアルタイムフィードバック
  const setDragOverGroupId = useUiStore((s) => s.setDragOverGroupId);

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "addPersonPlaceholder") {
        setDragOverGroupId(null);
        return;
      }
      if (node.type === "orgGroup") {
        // グループD&D: 自分自身と子孫を除外してドロップ先を検出
        const draggedGroupId = node.id.replace(/^group-/, "");
        const absPos = getNodeAbsolutePosition(node);
        const targetGroupId = findDropTargetGroup(absPos, draggedGroupId);
        setDragOverGroupId(targetGroupId);
        return;
      }
      const absPos = getNodeAbsolutePosition(node);
      const targetGroupId = findDropTargetGroup(absPos);
      setDragOverGroupId(targetGroupId);
    },
    [getNodeAbsolutePosition, findDropTargetGroup, setDragOverGroupId]
  );

  const updateGroup = useOrgGroupStore((s) => s.updateGroup);
  const reorderGroup = useOrgGroupStore((s) => s.reorderGroup);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // ドラッグオーバー状態をリセット
      setDragOverGroupId(null);

      // プレースホルダーのドラッグは無視
      if (node.type === "addPersonPlaceholder") return;

      // グループノードのD&D: parentGroupId変更 or 兄弟間並び替え
      if (node.type === "orgGroup") {
        const draggedGroupId = node.id.replace(/^group-/, "");
        const absPos = getNodeAbsolutePosition(node);
        const targetGroupId = findDropTargetGroup(absPos, draggedGroupId);
        const draggedGroup = orgGroups.find((g) => g.id === draggedGroupId);
        const currentParent = draggedGroup?.parentGroupId ?? null;

        if (targetGroupId !== currentParent) {
          // 親グループが変わる → 移動（末尾に追加）
          captureSnapshot();
          const newSiblings = orgGroups.filter(
            (g) => g.parentGroupId === targetGroupId && g.id !== draggedGroupId
          );
          const maxOrder = newSiblings.reduce((max, g) => Math.max(max, g.sortOrder ?? 0), -1);
          updateGroup(draggedGroupId, dealId, {
            parentGroupId: targetGroupId,
            sortOrder: maxOrder + 1,
          });

          const targetGroup = orgGroups.find((g) => g.id === targetGroupId);
          if (targetGroupId && targetGroup) {
            toast.success(`${draggedGroup?.name ?? ""} を ${targetGroup.name} の配下に移動しました`);
          } else {
            toast.success(`${draggedGroup?.name ?? ""} をトップレベルに移動しました`);
          }
          return;
        }

        // 同じ親 → 兄弟間の横並び順序を入れ替え
        const siblings = orgGroups
          .filter((g) => g.parentGroupId === currentParent && g.dealId === dealId)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (siblings.length <= 1) return;

        // ドラッグしたグループの幅をgroupBoundsから取得
        const draggedBound = groupBoundsRef.current.find((gb) => gb.groupId === draggedGroupId);
        const dragCenterX = absPos.x + (draggedBound?.width ?? GROUP_LAYOUT.nodeWidth) / 2;

        // 兄弟（自分以外）のcenterX一覧と比較して新しいインデックスを算出
        const otherSiblings = siblings.filter((g) => g.id !== draggedGroupId);
        let newIndex = 0;
        for (const sib of otherSiblings) {
          const bound = groupBoundsRef.current.find((gb) => gb.groupId === sib.id);
          const sibCenterX = bound ? bound.x + bound.width / 2 : Infinity;
          if (sibCenterX < dragCenterX) newIndex++;
        }

        const currentIndex = siblings.findIndex((g) => g.id === draggedGroupId);
        if (newIndex === currentIndex) return; // 順序変更なし

        captureSnapshot();
        reorderGroup(draggedGroupId, dealId, newIndex);
        toast.success(`${draggedGroup?.name ?? ""} の順序を変更しました`);
        return;
      }

      // ステークホルダーノードのD&D（既存ロジック）
      const absPos = getNodeAbsolutePosition(node);
      const targetGroupId = findDropTargetGroup(absPos);
      const s = stakeholders.find((st) => st.id === node.id);
      const currentGroupId = s?.groupId ?? null;

      if (targetGroupId !== currentGroupId) {
        captureSnapshot();
        const targetGroup = orgGroups.find((g) => g.id === targetGroupId);
        const updates: Partial<import("@/types/stakeholder").Stakeholder> = {
          groupId: targetGroupId,
        };
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
        updateNodePosition(node.id, dealId, node.position);
      }
    },
    [dealId, stakeholders, orgGroups, getNodeAbsolutePosition, findDropTargetGroup, updateStakeholder, updateNodePosition, updateGroup, reorderGroup, captureSnapshot, setDragOverGroupId]
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
