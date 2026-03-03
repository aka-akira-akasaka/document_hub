import type { Node, Edge } from "@xyflow/react";
import type { Stakeholder } from "@/types/stakeholder";
import type { OrgGroup } from "@/types/org-group";
import { GROUP_LAYOUT } from "./constants";

/** グループツリーの内部表現 */
interface GroupTreeNode {
  group: OrgGroup;
  children: GroupTreeNode[];
  members: Stakeholder[];
  /** 計算されたサイズ */
  width: number;
  height: number;
}

/** レイアウト計算結果 */
export interface GroupLayoutResult {
  nodes: Node[];
  edges: Edge[];
  /** グループノードの絶対位置とサイズ（ドロップ先検出用） */
  groupBounds: GroupBound[];
}

/** グループの絶対位置とサイズ（ドラッグ&ドロップ用） */
export interface GroupBound {
  groupId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** レイアウト計算のオプション */
export interface GroupLayoutOptions {
  /** ドラッグ中の並べ替えプレビュー */
  reorderPreview?: {
    parentGroupId: string | null;
    draggedGroupId: string;
    insertIndex: number;
  } | null;
}

/**
 * グループベースレイアウトのメイン関数
 * stakeholderノードは絶対座標で配置（ドラッグ&ドロップ対応）
 * グループノードはReactFlowの親子関係でネスト
 */
export function computeGroupLayout(
  stakeholders: Stakeholder[],
  orgGroups: OrgGroup[],
  reportingEdges: Edge[],
  options?: GroupLayoutOptions
): GroupLayoutResult {
  const draggedGroupId = options?.reorderPreview?.draggedGroupId ?? null;

  // Step 1: グループツリーを構築
  const groupTree = buildGroupTree(orgGroups, options?.reorderPreview ?? undefined);

  // Step 2: ステークホルダーをグループに振り分け
  const freeFloating = assignStakeholders(stakeholders, groupTree, orgGroups);

  // Step 3: グループサイズをボトムアップで計算
  for (const root of groupTree) {
    computeGroupSize(root);
  }

  // Step 4: グループ位置をトップダウンで割り当て
  const nodes: Node[] = [];
  const groupBounds: GroupBound[] = [];
  let currentX = 0;

  // フリーフローティングノードを上部に配置
  let freeX = 0;
  for (const s of freeFloating) {
    nodes.push({
      id: s.id,
      type: "stakeholder",
      position: { x: freeX, y: GROUP_LAYOUT.freeFloatY },
      zIndex: 10,
      data: { ...s },
    });
    freeX += GROUP_LAYOUT.nodeWidth + GROUP_LAYOUT.freeFloatGap;
  }

  // ルートグループ（division）を横並び配置
  for (const root of groupTree) {
    positionGroupTree(
      root,
      currentX, GROUP_LAYOUT.groupAreaY,  // 相対座標（ルートなので=絶対座標）
      currentX, GROUP_LAYOUT.groupAreaY,  // 絶対座標
      null,                                // 親グループなし
      nodes,
      groupBounds,
      draggedGroupId
    );
    currentX += root.width + GROUP_LAYOUT.divisionGap;
  }

  return { nodes, edges: reportingEdges, groupBounds };
}

/**
 * OrgGroupの配列からツリー構造を構築
 * reorderPreview が渡された場合、ドラッグ中のグループの兄弟順序をプレビュー通りに入れ替える
 */
function buildGroupTree(
  orgGroups: OrgGroup[],
  reorderPreview?: { parentGroupId: string | null; draggedGroupId: string; insertIndex: number }
): GroupTreeNode[] {
  const nodeMap = new Map<string, GroupTreeNode>();

  // まず全グループのノードを作成
  for (const group of orgGroups) {
    nodeMap.set(group.id, {
      group,
      children: [],
      members: [],
      width: 0,
      height: 0,
    });
  }

  // 親子関係を構築
  const roots: GroupTreeNode[] = [];
  for (const group of orgGroups) {
    const node = nodeMap.get(group.id)!;
    if (group.parentGroupId && nodeMap.has(group.parentGroupId)) {
      nodeMap.get(group.parentGroupId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // sortOrder順にソート（横並びの表示順序を制御）
  const sortBySortOrder = (arr: GroupTreeNode[]) =>
    arr.sort((a, b) => (a.group.sortOrder ?? 0) - (b.group.sortOrder ?? 0));

  roots.sort((a, b) => (a.group.sortOrder ?? 0) - (b.group.sortOrder ?? 0));
  for (const node of nodeMap.values()) {
    sortBySortOrder(node.children);
  }

  // プレビュー並べ替え: ドラッグ中のグループを兄弟内で移動
  if (reorderPreview) {
    const { parentGroupId, draggedGroupId, insertIndex } = reorderPreview;
    const siblings = parentGroupId === null
      ? roots
      : (nodeMap.get(parentGroupId)?.children ?? []);

    const draggedIdx = siblings.findIndex((n) => n.group.id === draggedGroupId);
    if (draggedIdx !== -1 && draggedIdx !== insertIndex) {
      const [dragged] = siblings.splice(draggedIdx, 1);
      const targetIdx = insertIndex > draggedIdx ? insertIndex - 1 : insertIndex;
      siblings.splice(Math.min(targetIdx, siblings.length), 0, dragged);
    }
  }

  return roots;
}

/**
 * ステークホルダーをグループに振り分け、フリーフローティングを返す
 */
function assignStakeholders(
  stakeholders: Stakeholder[],
  groupTree: GroupTreeNode[],
  orgGroups: OrgGroup[]
): Stakeholder[] {
  const groupNodeMap = new Map<string, GroupTreeNode>();
  const collectNodes = (nodes: GroupTreeNode[]) => {
    for (const n of nodes) {
      groupNodeMap.set(n.group.id, n);
      collectNodes(n.children);
    }
  };
  collectNodes(groupTree);

  const freeFloating: Stakeholder[] = [];
  const groupIds = new Set(orgGroups.map((g) => g.id));

  for (const s of stakeholders) {
    if (s.groupId && groupIds.has(s.groupId)) {
      const node = groupNodeMap.get(s.groupId);
      if (node) {
        node.members.push(s);
      } else {
        freeFloating.push(s);
      }
    } else {
      freeFloating.push(s);
    }
  }

  // メンバーをorgLevelで並び替え
  for (const node of groupNodeMap.values()) {
    node.members.sort((a, b) => a.orgLevel - b.orgLevel);
  }

  return freeFloating;
}

/**
 * メンバーをorgLevelごとにグループ化（同orgLevel → 横並び）
 * 前提: membersはorgLevel昇順でソート済み
 */
function groupMembersByLevel(members: Stakeholder[]): Stakeholder[][] {
  if (members.length === 0) return [];
  const rows: Stakeholder[][] = [];
  let currentLevel = -Infinity;
  for (const m of members) {
    if (m.orgLevel !== currentLevel) {
      rows.push([m]);
      currentLevel = m.orgLevel;
    } else {
      rows[rows.length - 1].push(m);
    }
  }
  return rows;
}

/**
 * グループサイズをボトムアップで計算
 * 同orgLevelのメンバーは横並びで配置するため、行ごとの最大幅で計算
 */
function computeGroupSize(node: GroupTreeNode): void {
  // 子グループを先に計算
  for (const child of node.children) {
    computeGroupSize(child);
  }

  const { headerHeight, footerHeight, innerPadding, nodeWidth, nodeHeight, nodeGap, nodeHGap, subGroupGap, placeholderHeight } = GROUP_LAYOUT;

  // メンバーをorgLevelごとにグループ化
  const levelRows = groupMembersByLevel(node.members);
  const rowCount = levelRows.length;

  // メンバー領域の高さ（行数ベース）
  const membersHeight = rowCount > 0
    ? rowCount * nodeHeight + (rowCount - 1) * nodeGap + nodeGap + placeholderHeight
    : placeholderHeight;

  // 最大行幅（同orgLevelの横並び幅）
  let maxRowWidth: number = nodeWidth;
  for (const row of levelRows) {
    const rowWidth = row.length * nodeWidth + (row.length - 1) * nodeHGap;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
  }

  // サブグループの合計幅と最大高さ
  let subGroupsTotalWidth = 0;
  let subGroupsMaxHeight = 0;
  for (const child of node.children) {
    subGroupsTotalWidth += child.width;
    subGroupsMaxHeight = Math.max(subGroupsMaxHeight, child.height);
  }
  if (node.children.length > 1) {
    subGroupsTotalWidth += (node.children.length - 1) * subGroupGap;
  }

  // 幅: 最大行幅とサブグループ幅の大きい方 + パディング
  const contentWidth = Math.max(maxRowWidth, subGroupsTotalWidth);
  node.width = contentWidth + innerPadding * 2;

  // 高さ: ヘッダー + メンバー + サブグループ + フッター + パディング
  let contentHeight = headerHeight + innerPadding;
  if (membersHeight > 0) {
    contentHeight += membersHeight + nodeGap;
  }
  if (subGroupsMaxHeight > 0) {
    contentHeight += subGroupsMaxHeight + nodeGap;
  }
  contentHeight += footerHeight + innerPadding;

  node.height = contentHeight;
}

/**
 * グループとその中身のReactFlowノードを再帰的に配置
 * stakeholderノードはグループの子ノード（相対座標 + parentId）
 * グループノードはReactFlowの親子関係でネスト
 */
function positionGroupTree(
  node: GroupTreeNode,
  relX: number,
  relY: number,
  absX: number,
  absY: number,
  parentGroupNodeId: string | null,
  nodes: Node[],
  groupBounds: GroupBound[],
  draggedGroupId?: string | null
): void {
  const groupNodeId = `group-${node.group.id}`;
  const { headerHeight, innerPadding, nodeWidth, nodeHeight, nodeGap, nodeHGap, subGroupGap, placeholderHeight } = GROUP_LAYOUT;

  // ドラッグ中でないグループノードにCSS transitionを付ける（アニメーション用）
  const isDragging = draggedGroupId === node.group.id;

  // グループノード自体を追加（親子関係はグループ同士のみ）
  const groupNode: Node = {
    id: groupNodeId,
    type: "orgGroup",
    position: { x: relX, y: relY },
    data: { ...node.group },
    style: {
      width: node.width,
      height: node.height,
      ...(isDragging ? {} : { transition: "transform 200ms ease-in-out" }),
    },
  };
  if (parentGroupNodeId) {
    groupNode.parentId = parentGroupNodeId;
    // extent: "parent" はあえて設定しない
    // → ネストされたグループを親の外にドラッグして別部門へ移動・トップレベルへ取り出しを可能にする
  }
  nodes.push(groupNode);

  // グループの絶対位置をドロップ先検出用に記録
  groupBounds.push({
    groupId: node.group.id,
    x: absX,
    y: absY,
    width: node.width,
    height: node.height,
  });

  // 直属メンバーをorgLevelごとに横並び配置（相対座標 + parentId）
  const levelRows = groupMembersByLevel(node.members);
  let memberY = headerHeight + innerPadding;

  for (const row of levelRows) {
    const rowWidth = row.length * nodeWidth + (row.length - 1) * nodeHGap;
    const startX = (node.width - rowWidth) / 2;

    for (let i = 0; i < row.length; i++) {
      nodes.push({
        id: row[i].id,
        type: "stakeholder",
        position: { x: startX + i * (nodeWidth + nodeHGap), y: memberY },
        parentId: groupNodeId,
        zIndex: 10,
        data: { ...row[i] },
      });
    }
    memberY += nodeHeight + nodeGap;
  }

  // 「＋ 人を追加する」プレースホルダーノード
  const placeholderX = (node.width - nodeWidth) / 2;
  nodes.push({
    id: `placeholder-${node.group.id}`,
    type: "addPersonPlaceholder",
    position: { x: placeholderX, y: memberY },
    parentId: groupNodeId,
    zIndex: 5,
    selectable: false,
    draggable: false,
    data: { groupId: node.group.id },
    style: { width: nodeWidth, height: placeholderHeight },
  });
  memberY += placeholderHeight + nodeGap;

  // サブグループを配置
  if (node.children.length > 0) {
    const subGroupY = memberY;
    // サブグループ群を中央揃え
    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += child.width;
    }
    totalChildWidth += (node.children.length - 1) * subGroupGap;
    let subGroupX: number = Math.max(innerPadding, (node.width - totalChildWidth) / 2);

    for (const child of node.children) {
      positionGroupTree(
        child,
        subGroupX,                    // 親グループ内の相対座標
        subGroupY,
        absX + subGroupX,             // 絶対座標
        absY + subGroupY,
        groupNodeId,                  // 親グループのReactFlow ID
        nodes,
        groupBounds,
        draggedGroupId
      );
      subGroupX += child.width + subGroupGap;
    }
  }
}
