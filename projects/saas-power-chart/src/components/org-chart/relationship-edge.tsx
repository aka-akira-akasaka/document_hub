"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  Position,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { RelationshipType, RelationshipDirection } from "@/types/relationship";
import { isPositiveRelationship } from "@/lib/constants";
import { Pencil, Check, Trash2, ArrowRight, ArrowLeft, MoveHorizontal, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// ReactFlow getBezierPath 互換の制御点計算
// 矢印の向きを曲線の接線方向に合わせるため自前実装
// ============================================

function ctrlOffset(distance: number, curvature: number): number {
  if (distance >= 0) return 0.5 * distance;
  return curvature * 25 * Math.sqrt(-distance);
}

function ctrlPoint(
  pos: Position, x1: number, y1: number, x2: number, y2: number, c: number,
): [number, number] {
  switch (pos) {
    case Position.Left:   return [x1 - ctrlOffset(x1 - x2, c), y1];
    case Position.Right:  return [x1 + ctrlOffset(x2 - x1, c), y1];
    case Position.Top:    return [x1, y1 - ctrlOffset(y1 - y2, c)];
    case Position.Bottom: return [x1, y1 + ctrlOffset(y2 - y1, c)];
  }
}

/** 三次ベジェ上の点 B(t) を求める */
function cubicAt(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
}

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
  sourceType?: "stakeholder" | "group";
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
  const sourceType = edgeData?.sourceType ?? "stakeholder";
  const targetType = edgeData?.targetType ?? "stakeholder";
  const direction = edgeData?.direction ?? "forward";
  const customColor = edgeData?.color;
  const onDelete = edgeData?.onDelete;
  const onUpdate = edgeData?.onUpdate;

  // 片方でもグループなら直角パス、両方ステークホルダーなら曲線
  const isGroupEdge = sourceType === "group" || targetType === "group";
  const isPositive = isPositiveRelationship(relType);

  // カスタム色が設定されていればそれを使用、なければタイプに応じた既定色
  const strokeColor = customColor ?? (isGroupEdge ? "#9ca3af" : (isPositive ? "#3b82f6" : "#ef4444"));
  const strokeDash = isGroupEdge ? undefined : (isPositive ? undefined : "6 4");

  // カスタム矢印マーカーID
  const hasEndMarker = direction === "forward" || direction === "bidirectional";
  const hasStartMarker = direction === "reverse" || direction === "bidirectional";

  const pathParams = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };

  // グループ: getSmoothStepPath（直角パス）— orient="auto" で十分
  // 人物間: getBezierPath 互換の三次ベジェ — 矢印座標を直接計算
  let edgePath: string;
  let labelX: number;
  let labelY: number;
  // 人物間エッジ: シェブロン矢印の翼座標（transform 不要）
  let endArrow: { w1x: number; w1y: number; w2x: number; w2y: number } | null = null;
  let startArrow: { w1x: number; w1y: number; w2x: number; w2y: number } | null = null;

  if (isGroupEdge) {
    [edgePath, labelX, labelY] = getSmoothStepPath(pathParams);
  } else {
    // 制御点を計算（ReactFlow getBezierPath と同一アルゴリズム）
    const curv = 0.25;
    const [c1x, c1y] = ctrlPoint(sourcePosition, sourceX, sourceY, targetX, targetY, curv);
    const [c2x, c2y] = ctrlPoint(targetPosition, targetX, targetY, sourceX, sourceY, curv);

    // パス文字列（getBezierPath と同一出力）
    edgePath = `M${sourceX},${sourceY} C${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;
    // ラベル位置（三次ベジェの t=0.5 中点）
    labelX = sourceX * 0.125 + c1x * 0.375 + c2x * 0.375 + targetX * 0.125;
    labelY = sourceY * 0.125 + c1y * 0.375 + c2y * 0.375 + targetY * 0.125;

    // シェブロン矢印の翼座標を直接計算（transform 不使用、座標のみ）
    const ARROW_LEN = 8;
    const ARROW_OPEN = 25 * Math.PI / 180; // 25° 開き角
    const T = 0.85;

    if (hasEndMarker) {
      const nex = cubicAt(T, sourceX, c1x, c2x, targetX);
      const ney = cubicAt(T, sourceY, c1y, c2y, targetY);
      const a = Math.atan2(targetY - ney, targetX - nex);
      endArrow = {
        w1x: targetX - ARROW_LEN * Math.cos(a - ARROW_OPEN),
        w1y: targetY - ARROW_LEN * Math.sin(a - ARROW_OPEN),
        w2x: targetX - ARROW_LEN * Math.cos(a + ARROW_OPEN),
        w2y: targetY - ARROW_LEN * Math.sin(a + ARROW_OPEN),
      };
    }
    if (hasStartMarker) {
      const nsx = cubicAt(1 - T, sourceX, c1x, c2x, targetX);
      const nsy = cubicAt(1 - T, sourceY, c1y, c2y, targetY);
      const a = Math.atan2(nsy - sourceY, nsx - sourceX) + Math.PI; // 逆向き
      startArrow = {
        w1x: sourceX - ARROW_LEN * Math.cos(a - ARROW_OPEN),
        w1y: sourceY - ARROW_LEN * Math.sin(a - ARROW_OPEN),
        w2x: sourceX - ARROW_LEN * Math.cos(a + ARROW_OPEN),
        w2y: sourceY - ARROW_LEN * Math.sin(a + ARROW_OPEN),
      };
    }
  }

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
    // IME変換中（日本語入力の確定Enter）は無視
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
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
      {/* グループエッジ用 SVG マーカー（orient="auto" で軸揃えOK） */}
      {isGroupEdge && (
        <defs>
          {hasEndMarker && (
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
          {hasStartMarker && (
            <marker
              id={`arrow-start-${id}`}
              markerWidth="12"
              markerHeight="12"
              refX="2"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 12 0 L 0 6 L 12 12 Z" fill={strokeColor} />
            </marker>
          )}
        </defs>
      )}
      {/* エッジパス */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={hasEndMarker && isGroupEdge ? `url(#arrow-end-${id})` : undefined}
        markerStart={hasStartMarker && isGroupEdge ? `url(#arrow-start-${id})` : undefined}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: strokeDash,
        }}
      />
      {/* 人物間エッジ: シェブロン矢印（座標直接計算、transform不使用） */}
      {endArrow && (
        <path
          d={`M${endArrow.w1x},${endArrow.w1y} L${targetX},${targetY} L${endArrow.w2x},${endArrow.w2y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {startArrow && (
        <path
          d={`M${startArrow.w1x},${startArrow.w1y} L${sourceX},${sourceY} L${startArrow.w2x},${startArrow.w2y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

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
              data-pdf-hide=""
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
                  <MoveHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "p-1 rounded transition-colors",
                    editDirection === "none" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setEditDirection("none")}
                  title="矢印なし"
                >
                  <Minus className="w-3.5 h-3.5" />
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
            /* 通常表示: ラベル + 鉛筆・ゴミ箱（右肩配置） */
            <div className="relative">
              {customLabel && (
                <span
                  className={cn(
                    "inline-block text-[10px] leading-none font-medium px-2 py-1 rounded-sm whitespace-nowrap text-white",
                    badgeBg
                  )}
                  style={customColor ? { backgroundColor: customColor } : undefined}
                >
                  {customLabel}
                </span>
              )}
              {/* アイコンをラベル右肩に絶対配置（ラベルの中央揃えに影響しない） */}
              <div data-pdf-hide="" className={cn(
                "flex items-center gap-0.5",
                customLabel
                  ? "absolute -top-2.5 left-full ml-0.5"
                  : ""
              )}>
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
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
