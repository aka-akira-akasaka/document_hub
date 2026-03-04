"use client";

import { memo } from "react";

/**
 * 部署DnD並べ替え時に、ドロップ先を示すインジケーター枠
 * group-layout-engine から reorderPreview 中に自動生成される
 */
function ReorderDropIndicatorComponent() {
  return (
    <div
      className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/30 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export const ReorderDropIndicatorNode = memo(ReorderDropIndicatorComponent);
