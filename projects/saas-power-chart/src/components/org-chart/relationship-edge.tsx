"use client";

import { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType } from "@/types/relationship";

const EDGE_STYLES: Record<
  RelationshipType,
  { stroke: string; strokeDasharray?: string; strokeWidth: number }
> = {
  reporting: { stroke: "#6b7280", strokeWidth: 2 },
  influence: { stroke: "#3b82f6", strokeDasharray: "5 5", strokeWidth: 1.5 },
  alliance: { stroke: "#22c55e", strokeWidth: 2.5 },
  rivalry: { stroke: "#ef4444", strokeDasharray: "3 3", strokeWidth: 2 },
  informal: { stroke: "#a855f7", strokeDasharray: "8 4", strokeWidth: 1 },
};

function RelationshipEdgeComponent(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  } = props;

  const relType = ((data as Record<string, unknown>)?.type as RelationshipType) ?? "reporting";
  const label = (data as Record<string, unknown>)?.label as string | undefined;
  const style = EDGE_STYLES[relType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? "#2563eb" : style.stroke,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute bg-white px-1.5 py-0.5 rounded text-xs border shadow-sm pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
