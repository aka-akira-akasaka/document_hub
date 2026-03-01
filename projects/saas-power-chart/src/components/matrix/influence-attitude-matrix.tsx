"use client";

import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useUiStore } from "@/stores/ui-store";
import { ATTITUDE_LABELS } from "@/lib/constants";
import type { Attitude, Stakeholder } from "@/types/stakeholder";
import { EmptyState } from "@/components/layout/empty-state";
import { Users } from "lucide-react";

const EMPTY: Stakeholder[] = [];

interface InfluenceAttitudeMatrixProps {
  dealId: string;
}

const ATTITUDE_ORDER: Attitude[] = [
  "opposed",
  "cautious",
  "neutral",
  "supportive",
  "promoter",
];

const ATTITUDE_X: Record<Attitude, number> = {
  opposed: 0,
  cautious: 1,
  neutral: 2,
  supportive: 3,
  promoter: 4,
};

const SVG_WIDTH = 700;
const SVG_HEIGHT = 500;
const PADDING = { top: 40, right: 40, bottom: 60, left: 60 };
const CHART_W = SVG_WIDTH - PADDING.left - PADDING.right;
const CHART_H = SVG_HEIGHT - PADDING.top - PADDING.bottom;

function getPosition(s: Stakeholder): { cx: number; cy: number } {
  const xRatio = ATTITUDE_X[s.attitude] / 4;
  const yRatio = (s.influenceLevel - 1) / 4;
  return {
    cx: PADDING.left + xRatio * CHART_W,
    cy: PADDING.top + (1 - yRatio) * CHART_H,
  };
}

const DOT_COLORS: Record<Attitude, string> = {
  promoter: "#22c55e",
  supportive: "#3b82f6",
  neutral: "#9ca3af",
  cautious: "#f97316",
  opposed: "#ef4444",
};

export function InfluenceAttitudeMatrix({
  dealId,
}: InfluenceAttitudeMatrixProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );
  const openSheet = useUiStore((s) => s.openSheet);

  if (stakeholders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="ステークホルダーがいません"
          description="組織図ビューからステークホルダーを追加してください。"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-base font-semibold mb-2 text-center">
          影響力 × 態度マトリクス
        </h2>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="select-none">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = PADDING.top + (i / 4) * CHART_H;
            return (
              <line
                key={`h-${i}`}
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + CHART_W}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
            );
          })}
          {[0, 1, 2, 3, 4].map((i) => {
            const x = PADDING.left + (i / 4) * CHART_W;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={PADDING.top}
                x2={x}
                y2={PADDING.top + CHART_H}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Border */}
          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={CHART_W}
            height={CHART_H}
            fill="none"
            stroke="#d1d5db"
          />

          {/* Y axis labels */}
          {[1, 2, 3, 4, 5].map((level) => {
            const y = PADDING.top + ((5 - level) / 4) * CHART_H;
            return (
              <text
                key={`yl-${level}`}
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {level}
              </text>
            );
          })}
          <text
            x={PADDING.left - 40}
            y={PADDING.top + CHART_H / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${PADDING.left - 40}, ${PADDING.top + CHART_H / 2})`}
            className="text-xs fill-gray-600 font-medium"
          >
            影響力
          </text>

          {/* X axis labels */}
          {ATTITUDE_ORDER.map((att, i) => {
            const x = PADDING.left + (i / 4) * CHART_W;
            return (
              <text
                key={`xl-${att}`}
                x={x}
                y={PADDING.top + CHART_H + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {ATTITUDE_LABELS[att]}
              </text>
            );
          })}
          <text
            x={PADDING.left + CHART_W / 2}
            y={PADDING.top + CHART_H + 45}
            textAnchor="middle"
            className="text-xs fill-gray-600 font-medium"
          >
            態度
          </text>

          {/* Quadrant labels */}
          <text
            x={PADDING.left + CHART_W * 0.15}
            y={PADDING.top + 20}
            textAnchor="middle"
            className="text-xs fill-red-300"
          >
            高影響力・反対
          </text>
          <text
            x={PADDING.left + CHART_W * 0.85}
            y={PADDING.top + 20}
            textAnchor="middle"
            className="text-xs fill-green-300"
          >
            高影響力・推進
          </text>

          {/* Dots */}
          {stakeholders.map((s) => {
            const { cx, cy } = getPosition(s);
            const jitterX = (Math.random() - 0.5) * 20;
            const jitterY = (Math.random() - 0.5) * 20;
            return (
              <g
                key={s.id}
                className="cursor-pointer"
                onClick={() => openSheet(s.id, "view")}
              >
                <circle
                  cx={cx + jitterX}
                  cy={cy + jitterY}
                  r={8 + s.influenceLevel * 2}
                  fill={DOT_COLORS[s.attitude]}
                  fillOpacity={0.3}
                  stroke={DOT_COLORS[s.attitude]}
                  strokeWidth={2}
                />
                <text
                  x={cx + jitterX}
                  y={cy + jitterY - 12 - s.influenceLevel * 2}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 pointer-events-none"
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
