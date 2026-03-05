"use client";

import { memo } from "react";
import { useReactFlow } from "@xyflow/react";
import type { RemoteCursor } from "@/hooks/use-realtime-cursors";

interface CursorOverlayProps {
  cursors: Map<string, RemoteCursor>;
}

/** 他ユーザーのカーソルをキャンバス上にオーバーレイ表示（Figma風） */
function CursorOverlayComponent({ cursors }: CursorOverlayProps) {
  const { flowToScreenPosition } = useReactFlow();

  if (cursors.size === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => {
        const screenPos = flowToScreenPosition({ x: cursor.x, y: cursor.y });
        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* カーソル矢印 */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              className="drop-shadow-sm"
            >
              <path
                d="M0 0L16 12L8 12L4 20L0 0Z"
                fill={cursor.color}
              />
              <path
                d="M0 0L16 12L8 12L4 20L0 0Z"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            {/* ユーザー名ラベル */}
            <div
              className="absolute left-4 top-4 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const CursorOverlay = memo(CursorOverlayComponent);
