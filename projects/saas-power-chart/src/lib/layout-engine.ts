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
  nodeHeight: 100,
  rankSep: 80,
  nodeSep: 40,
};

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

  nodes.forEach((node) => {
    g.setNode(node.id, { width: opts.nodeWidth, height: opts.nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

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
