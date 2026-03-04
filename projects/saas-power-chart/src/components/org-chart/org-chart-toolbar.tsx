"use client";

import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Building2,
  Layers,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  Save,
  Undo2,
  User,
} from "lucide-react";

interface OrgChartToolbarProps {
  onAddNode: () => void;
  onAddGroup: () => void;
  onOpenLevelEditor: () => void;
  onSaveTemplate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function OrgChartToolbar({
  onAddNode,
  onAddGroup,
  onOpenLevelEditor,
  onSaveTemplate,
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
            onClick={onAddNode}
          >
            <span className="relative inline-flex">
              <User className="h-4 w-4" />
              <span className="absolute -top-1.5 -right-2 text-[9px] font-black leading-none">+</span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">人を追加する</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAddGroup}
          >
            <span className="relative inline-flex">
              <Building2 className="h-4 w-4" />
              <span className="absolute -top-1.5 -right-2 text-[9px] font-black leading-none">+</span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">部署を追加する</TooltipContent>
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
        <TooltipContent side="right">役職・組織の階層設定</TooltipContent>
      </Tooltip>

      <div className="border-t my-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSaveTemplate}
          >
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">テンプレートとして保存</TooltipContent>
      </Tooltip>
    </div>
  );
}
