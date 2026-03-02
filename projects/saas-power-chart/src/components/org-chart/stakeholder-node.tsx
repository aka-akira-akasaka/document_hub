"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ATTITUDE_COLORS, ROLE_LABELS } from "@/lib/constants";
import type { RoleInDeal, Stakeholder } from "@/types/stakeholder";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type StakeholderNodeData = Stakeholder & { label?: string };

/** 態度に応じてカード左端のカラーストリップを表示するか */
function hasColorStrip(attitude: string): boolean {
  return attitude !== "neutral";
}

/** 左肩ラベルを表示する役割 */
const ROLE_BADGE_STYLES: Partial<Record<RoleInDeal, { bg: string; text: string }>> = {
  decision_maker: { bg: "bg-red-500", text: "text-white" },
  approver: { bg: "bg-amber-500", text: "text-white" },
  initiator: { bg: "bg-blue-500", text: "text-white" },
};

function StakeholderNodeComponent({ data, selected }: NodeProps) {
  const s = data as unknown as StakeholderNodeData;
  const colors = ATTITUDE_COLORS[s.attitude];
  const showStrip = hasColorStrip(s.attitude);
  const roleBadge = ROLE_BADGE_STYLES[s.roleInDeal];
  const [hovered, setHovered] = useState(false);

  const handleClass = hovered
    ? "!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-blue-600 !rounded-full transition-all !overflow-visible before:content-[''] before:absolute before:-inset-3 before:rounded-full"
    : "!w-3 !h-3 !bg-transparent !border-0 !pointer-events-none transition-all";

  return (
    <div
      className="relative"
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

      {/* 役割ラベル（左肩） */}
      {roleBadge && (
        <div className={cn(
          "absolute -top-2.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none shadow-sm",
          roleBadge.bg, roleBadge.text
        )}>
          {ROLE_LABELS[s.roleInDeal]}
        </div>
      )}

      <div
        className={cn(
          "rounded-lg shadow-sm border bg-white w-[180px] h-[72px] cursor-pointer transition-all overflow-hidden",
          "border-gray-200",
          selected && "ring-2 ring-blue-400 shadow-md",
          showStrip && colors.cardBg
        )}
      >
        <div className="flex items-center h-full">
          {/* カラーストリップ（左端） */}
          {showStrip && (
            <div className={cn("w-1 self-stretch rounded-l-lg", colors.stripColor)} />
          )}

          {/* アバター + テキスト */}
          <div className="flex items-center gap-2.5 px-3 min-w-0">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const StakeholderNode = memo(StakeholderNodeComponent);
