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

/**
 * グループベースレイアウトのメイン関数
 * stakeholderノードは絶対座標で配置（ドラッグ&ドロップ対応）
 * グループノードはReactFlowの親子関係でネスト
 */
export function computeGroupLayout(
  stakeholders: Stakeholder[],
  orgGroups: OrgGroup[],
  reportingEdges: Edge[]
): GroupLayoutResult {
  // Step 1: グループツリーを構築
  const groupTree = buildGroupTree(orgGroups);

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
      groupBounds
    );
    currentX += root.width + GROUP_LAYOUT.divisionGap;
  }

  return { nodes, edges: reportingEdges, groupBounds };
}

/**
 * OrgGroupの配列からツリー構造を構築
 */
function buildGroupTree(orgGroups: OrgGroup[]): GroupTreeNode[] {
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
 * グループサイズをボトムアップで計算
 */
function computeGroupSize(node: GroupTreeNode): void {
  // 子グループを先に計算
  for (const child of node.children) {
    computeGroupSize(child);
  }

  const { headerHeight, footerHeight, innerPadding, nodeWidth, nodeHeight, nodeGap, subGroupGap } = GROUP_LAYOUT;

  // 直属メンバーの高さ
  const memberCount = node.members.length;
  const membersHeight = memberCount > 0
    ? memberCount * nodeHeight + (memberCount - 1) * nodeGap
    : 0;

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

  // 幅: メンバー幅とサブグループ幅の大きい方 + パディング
  const contentWidth = Math.max(
    nodeWidth,
    subGroupsTotalWidth
  );
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
  groupBounds: GroupBound[]
): void {
  const groupNodeId = `group-${node.group.id}`;
  const { headerHeight, innerPadding, nodeWidth, nodeHeight, nodeGap, subGroupGap } = GROUP_LAYOUT;

  // グループノード自体を追加（親子関係はグループ同士のみ）
  const groupNode: Node = {
    id: groupNodeId,
    type: "orgGroup",
    position: { x: relX, y: relY },
    data: { ...node.group },
    style: {
      width: node.width,
      height: node.height,
    },
  };
  if (parentGroupNodeId) {
    groupNode.parentId = parentGroupNodeId;
    groupNode.extent = "parent" as const;
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

  // 直属メンバーをグループの子ノードとして配置（相対座標 + parentId）
  let memberY = headerHeight + innerPadding;
  const memberX = (node.width - nodeWidth) / 2;

  for (const member of node.members) {
    nodes.push({
      id: member.id,
      type: "stakeholder",
      position: { x: memberX, y: memberY },
      parentId: groupNodeId,
      zIndex: 10,
      data: { ...member },
    });
    memberY += nodeHeight + nodeGap;
  }

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
        groupBounds
      );
      subGroupX += child.width + subGroupGap;
    }
  }
}
