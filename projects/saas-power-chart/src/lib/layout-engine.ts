import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

export interface LayoutOptions {
  direction: "TB" | "LR";
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: "TB",
  nodeWidth: 220,
  nodeHeight: 120,
  rankSep: 80,
  nodeSep: 40,
};

/**
 * orgLevelを考慮したレイアウト
 * orgLevelの差が2以上あるエッジにはダミーノードを挿入し、
 * Dagreに正しい階層レベルを強制する
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options?: Partial<LayoutOptions>
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  });

  // orgLevelマップを作成
  const levelMap = new Map<string, number>();
  for (const node of nodes) {
    const level = (node.data as Record<string, unknown>)?.orgLevel as number | undefined;
    if (level != null) {
      levelMap.set(node.id, level);
    }
  }

  // orgLevelが設定されていない場合はツリー深さから推定
  if (levelMap.size > 0 && levelMap.size < nodes.length) {
    const parentOf = new Map<string, string>();
    for (const edge of edges) {
      parentOf.set(edge.target, edge.source);
    }
    for (const node of nodes) {
      if (!levelMap.has(node.id)) {
        // 親のorgLevelから推定（親+1）
        const parentId = parentOf.get(node.id);
        if (parentId && levelMap.has(parentId)) {
          levelMap.set(node.id, levelMap.get(parentId)! + 1);
        }
      }
    }
  }

  const hasOrgLevels = levelMap.size > 0;

  // 実ノードを登録
  nodes.forEach((node) => {
    g.setNode(node.id, { width: opts.nodeWidth, height: opts.nodeHeight });
  });

  // ダミーノードIDのカウンター
  let dummyCount = 0;
  const dummyIds: string[] = [];

  // エッジを処理（orgLevel差が大きい場合はダミーノードを挿入）
  edges.forEach((edge) => {
    if (!hasOrgLevels) {
      g.setEdge(edge.source, edge.target);
      return;
    }

    const sourceLevel = levelMap.get(edge.source);
    const targetLevel = levelMap.get(edge.target);

    if (sourceLevel == null || targetLevel == null || targetLevel - sourceLevel <= 1) {
      g.setEdge(edge.source, edge.target);
      return;
    }

    // レベル差が2以上：ダミーノードを挿入
    let prevId = edge.source;
    for (let level = sourceLevel + 1; level < targetLevel; level++) {
      const dummyId = `__dummy_${dummyCount++}`;
      dummyIds.push(dummyId);
      // ダミーノードは幅0で水平スペースを消費しない
      g.setNode(dummyId, { width: 1, height: 1 });
      g.setEdge(prevId, dummyId);
      prevId = dummyId;
    }
    g.setEdge(prevId, edge.target);
  });

  Dagre.layout(g);

  // 実ノードの位置を取得（ダミーノードは除外）
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
