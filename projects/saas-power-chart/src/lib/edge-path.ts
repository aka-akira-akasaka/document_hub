/**
 * ハンドル方向を尊重しつつ自然な矢印角度を持つ三次ベジェ曲線パス。
 *
 * getBezierPath のアルゴリズムで制御点を計算（ハンドル方向に軸揃え）し、
 * 小さな垂直オフセットを加えることで:
 *   1. ノードとの重なりを回避（ハンドル方向に出発/到着）
 *   2. orient="auto" で矢印が自然な方向を向く（接線が斜めになる）
 *
 * relationship-edge.tsx と org-chart-canvas.tsx (接続線プレビュー) の両方で使用。
 */

import { Position } from "@xyflow/react";

function ctrlOffset(distance: number, curvature: number): number {
  if (distance >= 0) return 0.5 * distance;
  return curvature * 25 * Math.sqrt(-distance);
}

function axisCtrl(
  pos: Position, x1: number, y1: number, x2: number, y2: number, c: number,
): [number, number] {
  switch (pos) {
    case Position.Left:   return [x1 - ctrlOffset(x1 - x2, c), y1];
    case Position.Right:  return [x1 + ctrlOffset(x2 - x1, c), y1];
    case Position.Top:    return [x1, y1 - ctrlOffset(y1 - y2, c)];
    case Position.Bottom: return [x1, y1 + ctrlOffset(y2 - y1, c)];
  }
}

export interface BezierResult {
  path: string;
  labelX: number;
  labelY: number;
}

/**
 * ハンドル方向を尊重した三次ベジェパスを生成する。
 * 小さな垂直オフセットにより orient="auto" で自然な矢印角度が得られる。
 */
export function handleAwareBezier(
  sourceX: number, sourceY: number, sourcePosition: Position,
  targetX: number, targetY: number, targetPosition: Position,
): BezierResult {
  // getBezierPath 互換の制御点（ハンドル方向に軸揃え）
  const curv = 0.25;
  const [ac1x, ac1y] = axisCtrl(sourcePosition, sourceX, sourceY, targetX, targetY, curv);
  const [ac2x, ac2y] = axisCtrl(targetPosition, targetX, targetY, sourceX, sourceY, curv);

  // ソース→ターゲット直線に垂直なオフセットを加え、接線を斜めにする
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const perpAmount = Math.min(dist * 0.06, 20);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  const c1x = ac1x + nx * perpAmount;
  const c1y = ac1y + ny * perpAmount;
  const c2x = ac2x + nx * perpAmount;
  const c2y = ac2y + ny * perpAmount;

  const path = `M${sourceX},${sourceY} C${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;
  const labelX = sourceX * 0.125 + c1x * 0.375 + c2x * 0.375 + targetX * 0.125;
  const labelY = sourceY * 0.125 + c1y * 0.375 + c2y * 0.375 + targetY * 0.125;

  return { path, labelX, labelY };
}
