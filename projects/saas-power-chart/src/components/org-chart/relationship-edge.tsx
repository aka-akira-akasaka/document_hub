"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType } from "@/types/relationship";
import { isPositiveRelationship } from "@/lib/constants";
import { Pencil, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationshipEdgeData {
  type?: RelationshipType;
  label?: string;
  onDelete?: (edgeId: string) => void;
  onUpdate?: (edgeId: string, data: { label?: string }) => void;
}

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
  } = props;

  const edgeData = data as RelationshipEdgeData | undefined;
  const relType = edgeData?.type ?? "informal";
  const customLabel = edgeData?.label;
  const onDelete = edgeData?.onDelete;
  const onUpdate = edgeData?.onUpdate;

  const isPositive = isPositiveRelationship(relType);

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

  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(customLabel ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditLabel(customLabel ?? "");
    setIsEditing(true);
  }, [customLabel]);

  const handleConfirmEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate?.(id, { label: editLabel.trim() || undefined });
    setIsEditing(false);
  }, [id, editLabel, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      onUpdate?.(id, { label: editLabel.trim() || undefined });
      setIsEditing(false);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  }, [id, editLabel, onUpdate]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(id);
    },
    [id, onDelete]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: strokeDash,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            zIndex: 10000,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {isEditing ? (
            /* 編集モード */
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md shadow-md px-2 py-1">
              <input
                ref={inputRef}
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-32 text-xs border-0 outline-none bg-transparent"
                placeholder="ラベルを入力..."
              />
              <button
                className="text-green-600 hover:text-green-700 p-0.5"
                onClick={handleConfirmEdit}
                title="確定"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                className="text-red-500 hover:text-red-700 p-0.5"
                onClick={handleDelete}
                title="削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* 通常表示: ラベル + ホバー時に鉛筆アイコン */
            <div
              className="flex items-center justify-center gap-1"
              style={{ minWidth: 24, minHeight: 24 }}
            >
              {customLabel && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-sm whitespace-nowrap",
                    isPositive
                      ? "bg-blue-500 text-white"
                      : "bg-red-500 text-white"
                  )}
                >
                  {customLabel}
                </span>
              )}
              <button
                className={cn(
                  "p-1 rounded-full transition-all",
                  hovered
                    ? "opacity-100 bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600"
                    : "opacity-0"
                )}
                onClick={handleStartEdit}
                title="編集"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
