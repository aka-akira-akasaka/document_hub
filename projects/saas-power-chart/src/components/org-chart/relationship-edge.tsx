"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  EdgeLabelRenderer,
  MarkerType,
} from "@xyflow/react";
import type { RelationshipType, RelationshipDirection } from "@/types/relationship";
import { isPositiveRelationship } from "@/lib/constants";
import { Pencil, Check, Trash2, ArrowRight, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** エッジのカスタム色プリセット */
const COLOR_PRESETS = [
  { value: "#3b82f6", label: "青" },
  { value: "#ef4444", label: "赤" },
  { value: "#22c55e", label: "緑" },
  { value: "#f97316", label: "橙" },
  { value: "#a855f7", label: "紫" },
  { value: "#6b7280", label: "灰" },
  { value: "#000000", label: "黒" },
];

interface RelationshipEdgeData {
  type?: RelationshipType;
  label?: string;
  targetType?: "stakeholder" | "group";
  direction?: RelationshipDirection;
  color?: string;
  onDelete?: (edgeId: string) => void;
  onUpdate?: (edgeId: string, data: { label?: string; direction?: RelationshipDirection; color?: string }) => void;
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
  const targetType = edgeData?.targetType ?? "stakeholder";
  const direction = edgeData?.direction ?? "forward";
  const customColor = edgeData?.color;
  const onDelete = edgeData?.onDelete;
  const onUpdate = edgeData?.onUpdate;

  const isGroupEdge = targetType === "group";
  const isPositive = isPositiveRelationship(relType);

  // カスタム色が設定されていればそれを使用、なければタイプに応じた既定色
  const strokeColor = customColor ?? (isGroupEdge ? "#9ca3af" : (isPositive ? "#3b82f6" : "#ef4444"));
  const strokeDash = isGroupEdge ? undefined : (isPositive ? undefined : "6 4");

  // 矢印マーカー（方向に応じて設定）
  const arrowMarker = { type: MarkerType.ArrowClosed, color: strokeColor, width: 16, height: 16 };
  const markerEnd = (direction === "forward" || direction === "bidirectional") ? arrowMarker : undefined;
  const markerStart = (direction === "reverse" || direction === "bidirectional") ? arrowMarker : undefined;

  const pathParams = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [edgePath, labelX, labelY] = isGroupEdge
    ? getSmoothStepPath(pathParams)
    : getBezierPath(pathParams);

  // 編集状態
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(customLabel ?? "");
  const [editDirection, setEditDirection] = useState<RelationshipDirection>(direction);
  const [editColor, setEditColor] = useState<string>(customColor ?? "");
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
    setEditDirection(direction);
    setEditColor(customColor ?? "");
    setIsEditing(true);
  }, [customLabel, direction, customColor]);

  const handleConfirmEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate?.(id, {
      label: editLabel.trim() || undefined,
      direction: editDirection,
      color: editColor || undefined,
    });
    setIsEditing(false);
  }, [id, editLabel, editDirection, editColor, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      onUpdate?.(id, {
        label: editLabel.trim() || undefined,
        direction: editDirection,
        color: editColor || undefined,
      });
      setIsEditing(false);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  }, [id, editLabel, editDirection, editColor, onUpdate]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(id);
    },
    [id, onDelete]
  );

  // ラベルバッジの色
  const badgeBg = customColor
    ? undefined
    : isGroupEdge
      ? "bg-gray-500"
      : isPositive
        ? "bg-blue-500"
        : "bg-red-500";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd ? `url(#${MarkerType.ArrowClosed})` : undefined}
        markerStart={markerStart ? `url(#${MarkerType.ArrowClosed})` : undefined}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: strokeDash,
        }}
      />
      {/* カスタム矢印マーカーをSVG defsで定義 */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          {/* forward / bidirectional 用の終点マーカー */}
          {(direction === "forward" || direction === "bidirectional") && (
            <marker
              id={`arrow-end-${id}`}
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 12 6 L 0 12 Z" fill={strokeColor} />
            </marker>
          )}
          {/* reverse / bidirectional 用の始点マーカー */}
          {(direction === "reverse" || direction === "bidirectional") && (
            <marker
              id={`arrow-start-${id}`}
              markerWidth="12"
              markerHeight="12"
              refX="2"
              refY="6"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 12 0 L 0 6 L 12 12 Z" fill={strokeColor} />
            </marker>
          )}
        </defs>
      </svg>
      {/* カスタムマーカー付きのパスを上書き描画 */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray={strokeDash}
        markerEnd={(direction === "forward" || direction === "bidirectional") ? `url(#arrow-end-${id})` : undefined}
        markerStart={(direction === "reverse" || direction === "bidirectional") ? `url(#arrow-start-${id})` : undefined}
        style={{ pointerEvents: "none" }}
      />

      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            zIndex: 10000,
          }}
        >
          {isEditing ? (
            /* 編集パネル */
            <div
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-2"
              onClick={(e) => e.stopPropagation()}
              style={{ minWidth: 220 }}
            >
              {/* 方向トグル */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium mr-1 shrink-0">方向</span>
                <button
                  type="button"
                  className={cn(
                    "p-1 rounded transition-colors",
                    editDirection === "forward" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setEditDirection("forward")}
                  title="順方向"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "p-1 rounded transition-colors",
                    editDirection === "reverse" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setEditDirection("reverse")}
                  title="逆方向"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "p-1 rounded transition-colors",
                    editDirection === "bidirectional" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setEditDirection("bidirectional")}
                  title="双方向"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>

                {/* 区切り */}
                <div className="w-px h-4 bg-gray-200 mx-0.5" />

                {/* 色パレット */}
                <span className="text-[10px] text-muted-foreground font-medium mr-1 shrink-0">色</span>
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all shrink-0",
                      editColor === c.value ? "border-gray-800 scale-110" : "border-transparent hover:border-gray-300"
                    )}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setEditColor(c.value)}
                    title={c.label}
                  />
                ))}
                {/* デフォルトに戻す（×） */}
                <button
                  type="button"
                  className={cn(
                    "w-4 h-4 rounded-full border-2 text-[8px] flex items-center justify-center shrink-0",
                    !editColor ? "border-gray-800" : "border-gray-300 hover:border-gray-500"
                  )}
                  onClick={() => setEditColor("")}
                  title="既定色"
                >
                  <span className="text-gray-500">×</span>
                </button>
              </div>

              {/* ラベル入力 + 確定 + 削除 */}
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-blue-400"
                  placeholder="ラベルを入力..."
                />
                <button
                  className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                  onClick={handleConfirmEdit}
                  title="確定"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                  onClick={handleDelete}
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* 通常表示: ラベル + 鉛筆・ゴミ箱 */
            <div className="flex items-center gap-1">
              {customLabel && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-sm whitespace-nowrap text-white",
                    badgeBg
                  )}
                  style={customColor ? { backgroundColor: customColor } : undefined}
                >
                  {customLabel}
                </span>
              )}
              <button
                className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={handleStartEdit}
                title="編集"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                className="p-0.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={handleDelete}
                title="削除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
