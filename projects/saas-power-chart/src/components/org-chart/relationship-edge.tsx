"use client";

import { memo, useCallback } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType } from "@/types/relationship";
import { isPositiveRelationship, RELATIONSHIP_EDGE_LABELS } from "@/lib/constants";
import { ArrowRight, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationshipEdgeData {
  type?: RelationshipType;
  label?: string;
  onDelete?: (edgeId: string, source: string, target: string, relType: RelationshipType) => void;
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
  const relType = edgeData?.type ?? "informal";
  const customLabel = edgeData?.label;
  const onDelete = edgeData?.onDelete;

  const isPositive = isPositiveRelationship(relType);
  const edgeLabel = RELATIONSHIP_EDGE_LABELS[relType];

  // エッジのスタイル: ポジティブ=青実線、ネガティブ=赤破線
  const strokeColor = isPositive ? "#3b82f6" : "#ef4444";
  const strokeDash = isPositive ? undefined : "6 4";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(id, source, target, relType);
    },
    [id, source, target, relType, onDelete]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? (isPositive ? "#2563eb" : "#dc2626") : strokeColor,
          strokeWidth: 2,
          strokeDasharray: strokeDash,
          zIndex: 1000,
        }}
      />
      <EdgeLabelRenderer>
        {/* ダークピルラベル */}
        <div
          className="absolute pointer-events-auto flex flex-col items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {/* メインピル */}
          <div className="flex items-center gap-1.5 bg-gray-800 text-white rounded-full px-3 py-1 text-xs whitespace-nowrap shadow-md">
            <span className="font-medium">ー{edgeLabel}ー</span>
            <ArrowRight className="w-3 h-3 text-gray-300" />
            <Copy className="w-3 h-3 text-gray-300 cursor-pointer hover:text-white" />
            {/* 削除ボタン */}
            <button
              className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors"
              onClick={handleDelete}
              title="削除"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* カスタムラベルバッジ */}
          {customLabel && (
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-sm",
                isPositive
                  ? "bg-blue-500 text-white"
                  : "bg-red-500 text-white"
              )}
            >
              {customLabel}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
