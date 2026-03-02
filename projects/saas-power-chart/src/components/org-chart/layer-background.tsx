"use client";

import { useViewport } from "@xyflow/react";
import type { LayerInfo } from "@/lib/layout-engine";

interface LayerBackgroundProps {
  layers: LayerInfo[];
}

const LAYER_COLORS = [
  "rgba(59, 130, 246, 0.05)",
  "rgba(107, 114, 128, 0.04)",
] as const;

export function LayerBackground({ layers }: LayerBackgroundProps) {
  const { y, zoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {layers.map((layer, index) => {
        const screenY = layer.y * zoom + y;
        const screenHeight = layer.height * zoom;

        return (
          <div
            key={layer.level}
            className="absolute left-0 right-0"
            style={{
              top: screenY,
              height: screenHeight,
              backgroundColor: LAYER_COLORS[index % 2],
              borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            }}
          >
            <div
              className="absolute left-3 select-none whitespace-nowrap text-muted-foreground/50 font-medium"
              style={{
                top: 6 * zoom,
                fontSize: Math.max(9, 11 * zoom),
              }}
            >
              L{layer.level}: {layer.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
