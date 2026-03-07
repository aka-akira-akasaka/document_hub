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
  /** ドラッグ中の並べ替えプレビュー（グループ） */
  reorderPreview?: {
    parentGroupId: string | null;
    draggedGroupId: string;
    insertIndex: number;
  } | null;
  /** ドラッグ中のステークホルダー並べ替えプレビュー */
  stakeholderReorderPreview?: {
    groupId: string;
    orgLevel: number;
    draggedStakeholderId: string;
    insertIndex: number;
  } | null;
  /** 役職階層定義（表示順でソートするため） */
  orgLevelConfig?: { level: number }[];
  /** 同一役職の1行あたり最大列数（デフォルト: 無制限） */
  maxColumnsPerRow?: number;
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
  const freeFloating = assignStakeholders(stakeholders, groupTree, orgGroups, options?.orgLevelConfig, options?.stakeholderReorderPreview);

  // Step 3: グループサイズをボトムアップで計算
  const maxColumns = options?.maxColumnsPerRow;
  for (const root of groupTree) {
    computeGroupSize(root, maxColumns);
  }

  // Step 4: グループ位置をトップダウンで割り当て
  const nodes: Node[] = [];
  const groupBounds: GroupBound[] = [];

  // フリーフローティングノードをparentIdベースのツリーレイアウトで配置
  // 保存済み座標がある場合はそれを優先
  const freePositions = layoutFreeFloatingTree(freeFloating);
  for (const s of freeFloating) {
    const pos = s.position ?? freePositions.get(s.id) ?? { x: 0, y: GROUP_LAYOUT.freeFloatY };
    nodes.push({
      id: s.id,
      type: "stakeholder",
      position: pos,
      zIndex: 10,
      data: { ...s },
    });
  }

  // ルートグループをtierごとに段分け配置（高tier=上段）
  const tierMap = new Map<number, GroupTreeNode[]>();
  for (const root of groupTree) {
    const tier = root.group.tier ?? 0;
    if (!tierMap.has(tier)) tierMap.set(tier, []);
    tierMap.get(tier)!.push(root);
  }
  // tier降順にソート（大きい数字が上段）
  const sortedTiers = [...tierMap.keys()].sort((a, b) => b - a);

  // 各tierの合計幅を先に計算（中央揃え用）
  const tierWidths = new Map<number, number>();
  for (const tier of sortedTiers) {
    const tierGroups = tierMap.get(tier)!;
    let totalWidth = 0;
    for (const root of tierGroups) {
      totalWidth += root.width;
    }
    totalWidth += Math.max(0, tierGroups.length - 1) * GROUP_LAYOUT.divisionGap;
    tierWidths.set(tier, totalWidth);
  }
  const maxTierWidth = sortedTiers.length > 0
    ? Math.max(...sortedTiers.map((t) => tierWidths.get(t)!))
    : 0;

  let currentTierY = GROUP_LAYOUT.groupAreaY;

  for (const tier of sortedTiers) {
    const tierGroups = tierMap.get(tier)!;
    const totalWidth = tierWidths.get(tier)!;
    // 最も幅の広いtierを基準に中央揃え
    let tierX = (maxTierWidth - totalWidth) / 2;
    let tierMaxHeight = 0;

    for (const root of tierGroups) {
      positionGroupTree(
        root,
        tierX, currentTierY,    // 相対座標（ルートなので=絶対座標）
        tierX, currentTierY,    // 絶対座標
        null,                    // 親グループなし
        nodes,
        groupBounds,
        draggedGroupId,
        maxColumns
      );
      tierX += root.width + GROUP_LAYOUT.divisionGap;
      tierMaxHeight = Math.max(tierMaxHeight, root.height);
    }

    currentTierY += tierMaxHeight + GROUP_LAYOUT.tierGap;
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
      // insertIndex は otherSiblings（除外後の配列）基準で計算されている
      siblings.splice(Math.min(insertIndex, siblings.length), 0, dragged);
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
  orgGroups: OrgGroup[],
  orgLevelConfig?: { level: number }[],
  stakeholderReorderPreview?: GroupLayoutOptions["stakeholderReorderPreview"]
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

  // メンバーを役職階層の設定順序で並び替え
  // （階層設定のUIでの並び順に準拠。設定外のlevelは末尾にフォールバック）
  const levelOrderMap = new Map<number, number>();
  if (orgLevelConfig && orgLevelConfig.length > 0) {
    orgLevelConfig.forEach((entry, idx) => {
      levelOrderMap.set(entry.level, idx);
    });
  }
  for (const node of groupNodeMap.values()) {
    node.members.sort((a, b) => {
      const orderA = levelOrderMap.get(a.orgLevel) ?? (1000 + a.orgLevel);
      const orderB = levelOrderMap.get(b.orgLevel) ?? (1000 + b.orgLevel);
      if (orderA !== orderB) return orderA - orderB;
      // 同一orgLevel内はsortOrder順
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    // ステークホルダー並べ替えプレビューを適用
    if (stakeholderReorderPreview && stakeholderReorderPreview.groupId === node.group.id) {
      const { orgLevel, draggedStakeholderId, insertIndex } = stakeholderReorderPreview;
      const levelMembers = node.members.filter((m) => m.orgLevel === orgLevel);
      const otherMembers = node.members.filter((m) => m.orgLevel !== orgLevel);
      const draggedIdx = levelMembers.findIndex((m) => m.id === draggedStakeholderId);
      if (draggedIdx !== -1 && draggedIdx !== insertIndex) {
        const [dragged] = levelMembers.splice(draggedIdx, 1);
        levelMembers.splice(Math.min(insertIndex, levelMembers.length), 0, dragged);
      }
      // orgLevel順を保持しつつ、対象レベル内のみ並べ替え済みで再構成
      node.members = [...otherMembers, ...levelMembers].sort((a, b) => {
        const oA = levelOrderMap.get(a.orgLevel) ?? (1000 + a.orgLevel);
        const oB = levelOrderMap.get(b.orgLevel) ?? (1000 + b.orgLevel);
        return oA - oB;
      });
    }
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
 * 列数制限を適用: 1行が maxColumns を超える場合に折り返す
 */
function applyColumnLimit(rows: Stakeholder[][], maxColumns: number): Stakeholder[][] {
  if (maxColumns <= 0) return rows;
  const result: Stakeholder[][] = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i += maxColumns) {
      result.push(row.slice(i, i + maxColumns));
    }
  }
  return result;
}

/**
 * グループサイズをボトムアップで計算
 * 同orgLevelのメンバーは横並びで配置するため、行ごとの最大幅で計算
 */
function computeGroupSize(node: GroupTreeNode, maxColumns?: number): void {
  // 子グループを先に計算
  for (const child of node.children) {
    computeGroupSize(child, maxColumns);
  }

  const { headerHeight, footerHeight, innerPadding, nodeWidth, nodeHeight, nodeGap, nodeHGap, subGroupGap, placeholderHeight } = GROUP_LAYOUT;

  // メンバーをorgLevelごとにグループ化 → 列数制限を適用
  let levelRows = groupMembersByLevel(node.members);
  if (maxColumns && maxColumns > 0) {
    levelRows = applyColumnLimit(levelRows, maxColumns);
  }
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
  draggedGroupId?: string | null,
  maxColumns?: number
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

  // 並べ替えプレビュー中: ドロップ先を示すインジケーター追加
  if (isDragging) {
    const indicator: Node = {
      id: "reorder-drop-indicator",
      type: "reorderDropIndicator",
      position: { x: relX, y: relY },
      data: {},
      style: {
        width: node.width,
        height: node.height,
        transition: "transform 200ms ease-in-out",
      },
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      zIndex: -1,
    };
    if (parentGroupNodeId) {
      indicator.parentId = parentGroupNodeId;
    }
    nodes.push(indicator);
  }

  // グループの絶対位置をドロップ先検出用に記録
  groupBounds.push({
    groupId: node.group.id,
    x: absX,
    y: absY,
    width: node.width,
    height: node.height,
  });

  // 直属メンバーをorgLevelごとに横並び配置（相対座標 + parentId）
  let levelRows = groupMembersByLevel(node.members);
  if (maxColumns && maxColumns > 0) {
    levelRows = applyColumnLimit(levelRows, maxColumns);
  }
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
        draggedGroupId,
        maxColumns
      );
      subGroupX += child.width + subGroupGap;
    }
  }
}

// ============================================
// フリーフローティングノードのツリーレイアウト
// ============================================

interface FreeTreeNode {
  stakeholder: Stakeholder;
  children: FreeTreeNode[];
  /** サブツリーの幅（リーフ=nodeWidth、親=子の合計幅） */
  subtreeWidth: number;
}

/**
 * parentIdを使ってフリーフローティングノードをツリー配置する
 * ルートノードは上段中央、子は下に横並びで配置
 */
function layoutFreeFloatingTree(
  freeFloating: Stakeholder[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (freeFloating.length === 0) return positions;

  const { nodeWidth, nodeHeight, freeFloatGap, freeFloatY } = GROUP_LAYOUT;
  const freeIds = new Set(freeFloating.map((s) => s.id));
  const verticalGap = 38;

  // ツリーを構築
  const nodeMap = new Map<string, FreeTreeNode>();
  for (const s of freeFloating) {
    nodeMap.set(s.id, { stakeholder: s, children: [], subtreeWidth: nodeWidth });
  }

  const roots: FreeTreeNode[] = [];
  for (const s of freeFloating) {
    const node = nodeMap.get(s.id)!;
    if (s.parentId && freeIds.has(s.parentId)) {
      nodeMap.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // サブツリー幅をボトムアップで計算
  function computeSubtreeWidth(node: FreeTreeNode): number {
    if (node.children.length === 0) {
      node.subtreeWidth = nodeWidth;
      return nodeWidth;
    }
    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += computeSubtreeWidth(child);
    }
    totalChildWidth += (node.children.length - 1) * freeFloatGap;
    node.subtreeWidth = Math.max(nodeWidth, totalChildWidth);
    return node.subtreeWidth;
  }

  for (const root of roots) {
    computeSubtreeWidth(root);
  }

  // 位置をトップダウンで割り当て
  function positionNode(node: FreeTreeNode, centerX: number, y: number) {
    positions.set(node.stakeholder.id, {
      x: centerX - nodeWidth / 2,
      y,
    });

    if (node.children.length === 0) return;

    const childY = y + nodeHeight + verticalGap;
    let childStartX = centerX - node.subtreeWidth / 2;

    for (const child of node.children) {
      const childCenterX = childStartX + child.subtreeWidth / 2;
      positionNode(child, childCenterX, childY);
      childStartX += child.subtreeWidth + freeFloatGap;
    }
  }

  // ルートノードを横並びで配置
  let totalRootWidth = 0;
  for (const root of roots) {
    totalRootWidth += root.subtreeWidth;
  }
  totalRootWidth += (roots.length - 1) * freeFloatGap;

  let rootStartX = -totalRootWidth / 2;
  // 最小X座標が0以上になるように調整
  if (rootStartX < 0) rootStartX = 0;

  let currentRootX = rootStartX;
  for (const root of roots) {
    const centerX = currentRootX + root.subtreeWidth / 2;
    positionNode(root, centerX, freeFloatY);
    currentRootX += root.subtreeWidth + freeFloatGap;
  }

  return positions;
}
