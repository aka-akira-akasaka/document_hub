import type { Node } from "@xyflow/react";
import { GROUP_LAYOUT } from "./constants";

const NODE_W = GROUP_LAYOUT.nodeWidth; // 180
const NODE_H = GROUP_LAYOUT.nodeHeight; // 72

interface HandlePos {
  id: string;
  x: number;
  y: number;
}

/** stakeholder ノードの source ハンドル座標（absX/Y はノード左上） */
function stakeholderSourceHandles(absX: number, absY: number): HandlePos[] {
  return [
    { id: "source-top", x: absX + NODE_W / 2, y: absY },
    { id: "source-bottom", x: absX + NODE_W / 2, y: absY + NODE_H },
    { id: "source-left", x: absX, y: absY + NODE_H / 2 },
    { id: "source-right", x: absX + NODE_W, y: absY + NODE_H / 2 },
  ];
}

/** stakeholder ノードの target ハンドル座標 */
function stakeholderTargetHandles(absX: number, absY: number): HandlePos[] {
  return [
    { id: "target-top", x: absX + NODE_W / 2, y: absY },
    { id: "target-bottom", x: absX + NODE_W / 2, y: absY + NODE_H },
    { id: "target-left", x: absX, y: absY + NODE_H / 2 },
    { id: "target-right", x: absX + NODE_W, y: absY + NODE_H / 2 },
  ];
}

/** group ノードの target ハンドル座標 */
function groupTargetHandles(
  absX: number,
  absY: number,
  w: number,
  h: number
): HandlePos[] {
  return [
    { id: "group-top", x: absX + w / 2, y: absY },
    { id: "group-bottom", x: absX + w / 2, y: absY + h },
    { id: "group-left", x: absX, y: absY + h / 2 },
    { id: "group-right", x: absX + w, y: absY + h / 2 },
  ];
}

export interface NodeInfo {
  absX: number;
  absY: number;
  width?: number;
  height?: number;
  isGroup: boolean;
}

/**
 * 2ノード間で最も距離が近い source/target ハンドルペアを返す
 */
export function findClosestHandlePair(
  source: NodeInfo,
  target: NodeInfo
): { sourceHandle: string; targetHandle: string } {
  const srcHandles = stakeholderSourceHandles(source.absX, source.absY);
  const tgtHandles = target.isGroup
    ? groupTargetHandles(
        target.absX,
        target.absY,
        target.width!,
        target.height!
      )
    : stakeholderTargetHandles(target.absX, target.absY);

  let bestDist = Infinity;
  let bestSrc = srcHandles[0].id;
  let bestTgt = tgtHandles[0].id;

  for (const sh of srcHandles) {
    for (const th of tgtHandles) {
      const dx = sh.x - th.x;
      const dy = sh.y - th.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestSrc = sh.id;
        bestTgt = th.id;
      }
    }
  }

  return { sourceHandle: bestSrc, targetHandle: bestTgt };
}

/**
 * ノードの絶対座標を算出（parent chain を辿る）
 */
export function getAbsolutePosition(
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

/**
 * レイアウト済みノード配列からエッジに最適な sourceHandle / targetHandle を付与する
 */
export function assignHandlesToEdges(
  edges: import("@xyflow/react").Edge[],
  nodes: Node[]
): import("@xyflow/react").Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const srcNode = nodeMap.get(edge.source);
    const tgtNode = nodeMap.get(edge.target);
    if (!srcNode || !tgtNode) return edge;

    const srcAbs = getAbsolutePosition(srcNode, nodeMap);
    const tgtAbs = getAbsolutePosition(tgtNode, nodeMap);

    const isGroupTarget = tgtNode.type === "orgGroup";
    const tgtW = isGroupTarget
      ? ((tgtNode.style?.width as number) ?? tgtNode.measured?.width ?? 0)
      : NODE_W;
    const tgtH = isGroupTarget
      ? ((tgtNode.style?.height as number) ?? tgtNode.measured?.height ?? 0)
      : NODE_H;

    const { sourceHandle, targetHandle } = findClosestHandlePair(
      { absX: srcAbs.x, absY: srcAbs.y, isGroup: false },
      {
        absX: tgtAbs.x,
        absY: tgtAbs.y,
        width: tgtW,
        height: tgtH,
        isGroup: isGroupTarget,
      }
    );

    return { ...edge, sourceHandle, targetHandle };
  });
}
