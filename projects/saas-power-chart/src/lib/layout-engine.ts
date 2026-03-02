import type { Node, Edge } from "@xyflow/react";
import type { Stakeholder } from "@/types/stakeholder";
import { LAYER_LAYOUT, DEFAULT_ORG_LEVELS } from "./constants";

/** レイヤー（背景バンド）の情報 */
export interface LayerInfo {
  level: number;
  label: string;
  /** レイヤー上端のY座標 */
  y: number;
  /** レイヤーの高さ */
  height: number;
  /** ノード配置のY中心座標 */
  centerY: number;
}

/** 通過レイヤー情報（エッジごとに算出） */
export interface PassthroughLayer {
  level: number;
  label: string;
  /** +ボタンのX座標（ワールド座標） */
  x: number;
  /** +ボタンのY座標（ワールド座標） */
  y: number;
}

/** レイヤーベースレイアウトの結果 */
export interface LayerLayoutResult {
  nodes: Node[];
  layers: LayerInfo[];
  /** エッジID → 通過レイヤー配列 */
  passthroughByEdge: Map<string, PassthroughLayer[]>;
}

/**
 * orgLevelConfigからLayerInfo[]を構築
 */
function buildLayers(
  orgLevelConfig: { level: number; label: string }[]
): LayerInfo[] {
  const levels = orgLevelConfig.length > 0 ? orgLevelConfig : DEFAULT_ORG_LEVELS;
  const layerHeight = LAYER_LAYOUT.nodeHeight + LAYER_LAYOUT.layerPadding * 2;

  return levels.map((entry, index) => {
    const y = index * layerHeight;
    return {
      level: entry.level,
      label: entry.label,
      y,
      height: layerHeight,
      centerY: y + layerHeight / 2,
    };
  });
}

/**
 * ツリー構造でX座標を計算するヘルパー
 * 各ノードのサブツリー幅を考慮して横並び配置
 */
function computeSubtreeWidth(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  widthCache: Map<string, number>
): number {
  if (widthCache.has(nodeId)) return widthCache.get(nodeId)!;

  const children = childrenMap.get(nodeId) ?? [];
  if (children.length === 0) {
    widthCache.set(nodeId, LAYER_LAYOUT.nodeWidth);
    return LAYER_LAYOUT.nodeWidth;
  }

  let totalWidth = 0;
  for (const childId of children) {
    totalWidth += computeSubtreeWidth(childId, childrenMap, widthCache);
    totalWidth += LAYER_LAYOUT.nodeSep;
  }
  totalWidth -= LAYER_LAYOUT.nodeSep; // 最後のsepを除く

  const width = Math.max(totalWidth, LAYER_LAYOUT.nodeWidth);
  widthCache.set(nodeId, width);
  return width;
}

function assignXPositions(
  nodeId: string,
  startX: number,
  childrenMap: Map<string, string[]>,
  widthCache: Map<string, number>,
  positionMap: Map<string, number>
): void {
  const children = childrenMap.get(nodeId) ?? [];
  const subtreeWidth = widthCache.get(nodeId) ?? LAYER_LAYOUT.nodeWidth;

  if (children.length === 0) {
    positionMap.set(nodeId, startX + subtreeWidth / 2 - LAYER_LAYOUT.nodeWidth / 2);
    return;
  }

  // 子ノードを配置
  let currentX = startX;
  const childXs: number[] = [];
  for (const childId of children) {
    const childWidth = widthCache.get(childId) ?? LAYER_LAYOUT.nodeWidth;
    assignXPositions(childId, currentX, childrenMap, widthCache, positionMap);
    childXs.push(positionMap.get(childId)!);
    currentX += childWidth + LAYER_LAYOUT.nodeSep;
  }

  // 親は子ノード群の中央に配置
  const leftmost = childXs[0];
  const rightmost = childXs[childXs.length - 1];
  positionMap.set(nodeId, (leftmost + rightmost) / 2);
}

/**
 * レイヤーベースレイアウトのメイン関数
 */
export function getLayerLayout(
  stakeholders: Stakeholder[],
  orgLevelConfig: { level: number; label: string }[],
  reportingEdges: Edge[]
): LayerLayoutResult {
  const layers = buildLayers(orgLevelConfig);
  const layerByLevel = new Map(layers.map((l) => [l.level, l]));

  // 親子関係マップ
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  for (const s of stakeholders) {
    if (s.parentId) {
      parentMap.set(s.id, s.parentId);
      const existing = childrenMap.get(s.parentId) ?? [];
      existing.push(s.id);
      childrenMap.set(s.parentId, existing);
    }
  }

  // ルートノード（親なし）を特定
  const roots = stakeholders.filter((s) => !s.parentId);

  // サブツリー幅を計算
  const widthCache = new Map<string, number>();
  for (const root of roots) {
    computeSubtreeWidth(root.id, childrenMap, widthCache);
  }

  // X座標を割り当て
  const positionMap = new Map<string, number>();
  let currentRootX = 0;
  for (const root of roots) {
    const rootWidth = widthCache.get(root.id) ?? LAYER_LAYOUT.nodeWidth;
    assignXPositions(root.id, currentRootX, childrenMap, widthCache, positionMap);
    currentRootX += rootWidth + LAYER_LAYOUT.nodeSep * 2;
  }

  // ノードにY座標を割り当て
  const nodes: Node[] = stakeholders.map((s) => {
    const layer = layerByLevel.get(s.orgLevel);
    const y = layer
      ? layer.centerY - LAYER_LAYOUT.nodeHeight / 2
      : 0;
    const x = positionMap.get(s.id) ?? 0;

    return {
      id: s.id,
      type: "stakeholder",
      position: { x, y },
      data: { ...s },
    };
  });

  // 通過レイヤーの計算
  const passthroughByEdge = new Map<string, PassthroughLayer[]>();
  const stakeholderMap = new Map(stakeholders.map((s) => [s.id, s]));

  for (const edge of reportingEdges) {
    const source = stakeholderMap.get(edge.source);
    const target = stakeholderMap.get(edge.target);
    if (!source || !target) continue;

    const sourceLevel = source.orgLevel;
    const targetLevel = target.orgLevel;
    if (targetLevel - sourceLevel <= 1) continue;

    const passthroughs: PassthroughLayer[] = [];
    const sourceX = (positionMap.get(source.id) ?? 0) + LAYER_LAYOUT.nodeWidth / 2;
    const targetX = (positionMap.get(target.id) ?? 0) + LAYER_LAYOUT.nodeWidth / 2;
    const midX = (sourceX + targetX) / 2;

    for (let level = sourceLevel + 1; level < targetLevel; level++) {
      const layer = layerByLevel.get(level);
      if (!layer) continue;
      passthroughs.push({
        level: layer.level,
        label: layer.label,
        x: midX,
        y: layer.centerY,
      });
    }

    if (passthroughs.length > 0) {
      passthroughByEdge.set(edge.id, passthroughs);
    }
  }

  return { nodes, layers, passthroughByEdge };
}
