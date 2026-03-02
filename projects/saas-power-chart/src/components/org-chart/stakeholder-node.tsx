"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ATTITUDE_COLORS } from "@/lib/constants";
import type { Stakeholder } from "@/types/stakeholder";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type StakeholderNodeData = Stakeholder & { label?: string };

/** 態度に応じてカード左端のカラーストリップを表示するか */
function hasColorStrip(attitude: string): boolean {
  return attitude === "promoter" || attitude === "supportive";
}

function StakeholderNodeComponent({ data, selected }: NodeProps) {
  const s = data as unknown as StakeholderNodeData;
  const colors = ATTITUDE_COLORS[s.attitude];
  const showStrip = hasColorStrip(s.attitude);
  const [hovered, setHovered] = useState(false);

  const handleClass = hovered
    ? "!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-blue-600 !rounded-full transition-all"
    : "!w-3 !h-3 !bg-transparent !border-0 transition-all";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 各辺に source + target ハンドルを配置（最近接ハンドル自動選択対応） */}
      <Handle type="target" position={Position.Top} id="target-top" className={handleClass} isConnectable />
      <Handle type="source" position={Position.Top} id="source-top" className={handleClass} isConnectable />
      <Handle type="target" position={Position.Bottom} id="target-bottom" className={handleClass} isConnectable />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className={handleClass} isConnectable />
      <Handle type="target" position={Position.Left} id="target-left" className={handleClass} isConnectable />
      <Handle type="source" position={Position.Left} id="source-left" className={handleClass} isConnectable />
      <Handle type="target" position={Position.Right} id="target-right" className={handleClass} isConnectable />
      <Handle type="source" position={Position.Right} id="source-right" className={handleClass} isConnectable />

      <div
        className={cn(
          "rounded-lg shadow-sm border bg-white w-[180px] cursor-pointer transition-all overflow-hidden",
          "border-gray-200",
          selected && "ring-2 ring-blue-400 shadow-md",
          showStrip && colors.cardBg
        )}
      >
        <div className="flex items-center">
          {/* カラーストリップ（左端） */}
          {showStrip && (
            <div className={cn("w-1 self-stretch rounded-l-lg", colors.stripColor)} />
          )}

          {/* アバター + テキスト */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-0">
            {/* 丸アバター */}
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                showStrip ? colors.avatarBg : "bg-gray-100"
              )}
            >
              <User
                className={cn(
                  "w-5 h-5",
                  showStrip ? colors.avatarText : "text-gray-400"
                )}
              />
            </div>

            {/* 名前 + 肩書 */}
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate leading-tight">
                {s.name}
              </p>
              <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                {s.title}
              </p>
              {/* 担当の場合は追加バッジ */}
              {s.notes && s.attitude === "supportive" && (
                <p className="text-[10px] text-blue-500 truncate mt-0.5">
                  {s.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 選択時ツールバー */}
      {selected && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          {NODE_TOOLBAR_ITEMS.map((item) => (
            <button
              key={item}
              className="px-2 py-1 text-[10px] text-gray-600 hover:bg-blue-50 hover:text-blue-600 whitespace-nowrap border-r border-gray-100 last:border-r-0 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const NODE_TOOLBAR_ITEMS = ["不明", "なし", "未選択", "非表示", "詳細"] as const;

export const StakeholderNode = memo(StakeholderNodeComponent);
