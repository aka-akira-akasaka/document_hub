"use client";

import { memo, useCallback } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType } from "@/types/relationship";
import { Plus } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

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
    source,
    target,
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
  const openAddPopover = useUiStore((s) => s.openAddPopover);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
  });

  const handleAddMidpoint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openAddPopover(
        { type: "edge", sourceId: source, targetId: target },
        { x: e.clientX, y: e.clientY }
      );
    },
    [source, target, openAddPopover]
  );

  const isReporting = relType === "reporting";

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
      <EdgeLabelRenderer>
        {/* ラベル（存在する場合） */}
        {label && (
          <div
            className="absolute bg-white px-1.5 py-0.5 rounded text-xs border shadow-sm pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${label ? labelY - 16 : labelY}px)`,
            }}
          >
            {label}
          </div>
        )}
        {/* reporting関係のみ: ライン中間の+ボタン */}
        {isReporting && (
          <div
            className="absolute pointer-events-auto group/edge"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <button
              className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10"
              onClick={handleAddMidpoint}
              title="中間者を追加"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
