"use client";

import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FolderTree,
  Layers,
  Maximize2,
  Minus,
  Network,
  Plus,
  Redo2,
  Undo2,
  UserPlus,
} from "lucide-react";

interface OrgChartToolbarProps {
  onAutoLayout: () => void;
  onAddNode: () => void;
  onOpenLevelEditor: () => void;
  onOpenGroupManager: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function OrgChartToolbar({
  onAutoLayout,
  onAddNode,
  onOpenLevelEditor,
  onOpenGroupManager,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: OrgChartToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-white rounded-lg shadow-md border p-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => zoomIn()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">ズームイン</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => zoomOut()}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">ズームアウト</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fitView({ padding: 0.2 })}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">全体表示</TooltipContent>
      </Tooltip>

      <div className="border-t my-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">元に戻す (⌘Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">やり直し (⌘⇧Z)</TooltipContent>
      </Tooltip>

      <div className="border-t my-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAutoLayout}
          >
            <Network className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">自動レイアウト</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAddNode}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">ステークホルダー追加</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenLevelEditor}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">階層設定</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenGroupManager}
          >
            <FolderTree className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">部門グループ管理</TooltipContent>
      </Tooltip>
    </div>
  );
}
