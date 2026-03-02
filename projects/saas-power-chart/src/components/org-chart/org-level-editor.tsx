"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useStakeholderStore, type OrgLevelEntry } from "@/stores/stakeholder-store";
import { DEFAULT_ORG_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface OrgLevelEditorProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgLevelEditor({ dealId, open, onOpenChange }: OrgLevelEditorProps) {
  const storedLevels = useStakeholderStore((s) => s.orgLevelConfigByDeal[dealId]);
  const setOrgLevels = useStakeholderStore((s) => s.setOrgLevels);

  // ローカル編集状態（ダイアログが開くたびにストアから読み込み）
  const [levels, setLevels] = useState<OrgLevelEntry[]>(() =>
    storedLevels && storedLevels.length > 0 ? [...storedLevels] : [...DEFAULT_ORG_LEVELS]
  );

  // D&D状態
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ダイアログが開くたびにストアから最新を取得
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        const current = useStakeholderStore.getState().orgLevelConfigByDeal[dealId];
        setLevels(current && current.length > 0 ? [...current] : [...DEFAULT_ORG_LEVELS]);
      }
      onOpenChange(nextOpen);
    },
    [dealId, onOpenChange]
  );

  const handleLabelChange = useCallback((index: number, label: string) => {
    setLevels((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, label } : entry))
    );
  }, []);

  const handleAdd = useCallback(() => {
    setLevels((prev) => {
      const nextLevel = prev.length > 0 ? prev[prev.length - 1].level + 1 : 1;
      return [...prev, { level: nextLevel, label: "" }];
    });
  }, []);

  const handleRemove = useCallback((index: number) => {
    setLevels((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
  }, []);

  // D&Dハンドラ
  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    setLevels((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setLevels([...DEFAULT_ORG_LEVELS]);
  }, []);

  const handleSave = useCallback(() => {
    const cleaned = levels
      .filter((l) => l.label.trim() !== "")
      .map((l, i) => ({ level: i + 1, label: l.label.trim() }));
    setOrgLevels(dealId, cleaned);
    toast.success("階層設定を保存しました");
    onOpenChange(false);
  }, [dealId, levels, setOrgLevels, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>組織階層の設定</DialogTitle>
          <DialogDescription>
            この案件で使用する役職階層を定義します。上から順に高い役職になります。ドラッグで並べ替えできます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {levels.map((entry, index) => (
            <div
              key={`${entry.level}-${index}`}
              className={`flex items-center gap-2 rounded-md px-1 py-1 transition-colors ${
                dragOverIndex === index ? "border-t-2 border-blue-500" : ""
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: dragIndexRef.current === index ? 0.5 : 1,
              }}
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" />
              <span className="w-8 text-center text-xs text-muted-foreground font-mono shrink-0">
                L{index + 1}
              </span>
              <Input
                value={entry.label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder="例: 部長"
                className="flex-1 h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                onClick={() => handleRemove(index)}
                disabled={levels.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          階層を追加
        </Button>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            デフォルトに戻す
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
