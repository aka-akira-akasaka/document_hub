"use client";

import { memo, useCallback } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType } from "@/types/relationship";
import type { PassthroughLayer } from "@/lib/layout-engine";
import { Plus, X } from "lucide-react";
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

interface RelationshipEdgeData {
  type?: RelationshipType;
  label?: string;
  onDelete?: (edgeId: string, source: string, target: string, relType: RelationshipType) => void;
  passthroughLayers?: PassthroughLayer[];
}

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

  const edgeData = data as RelationshipEdgeData | undefined;
  const relType = edgeData?.type ?? "reporting";
  const label = edgeData?.label;
  const onDelete = edgeData?.onDelete;
  const passthroughLayers = edgeData?.passthroughLayers ?? [];
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

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(id, source, target, relType);
    },
    [id, source, target, relType, onDelete]
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
        {/* エッジ操作ボタン群 */}
        <div
          className="absolute pointer-events-auto group/edge flex items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {/* reporting関係のみ: ライン中間の+ボタン */}
          {isReporting && (
            <button
              className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10"
              onClick={handleAddMidpoint}
              title="中間者を追加"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {/* 削除ボタン */}
          <button
            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10 opacity-0 group-hover/edge:opacity-100"
            onClick={handleDelete}
            title="つながりを削除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* 通過レイヤーの+ボタン */}
        {isReporting && passthroughLayers.map((pt) => (
            <button
              key={`pt-${pt.level}`}
              className="absolute w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform z-10 opacity-60 hover:opacity-100"
              style={{
                transform: `translate(-50%, -50%) translate(${pt.x}px,${pt.y}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                openAddPopover(
                  { type: "layer", sourceId: source, targetId: target, orgLevel: pt.level },
                  { x: e.clientX, y: e.clientY }
                );
              }}
              title={`${pt.label}を追加`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
        ))}
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
