"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useLayoutSettingsStore } from "@/stores/layout-settings-store";

interface NodeSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeSettings({ open, onOpenChange }: NodeSettingsProps) {
  const maxColumnsPerRow = useLayoutSettingsStore((s) => s.maxColumnsPerRow);
  const setMaxColumnsPerRow = useLayoutSettingsStore((s) => s.setMaxColumnsPerRow);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ノード設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* 最大列数設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                1行あたりの最大列数
              </label>
              <span className="text-sm font-bold text-blue-600 tabular-nums w-8 text-center">
                {maxColumnsPerRow}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              同じ役職の人が複数いる場合、この列数で折り返して配置します。
            </p>
            <Slider
              value={[maxColumnsPerRow]}
              onValueChange={([v]) => setMaxColumnsPerRow(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
