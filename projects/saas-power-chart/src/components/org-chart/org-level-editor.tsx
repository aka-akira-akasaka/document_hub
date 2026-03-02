"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
      // レベル番号を振り直し
      return filtered.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setLevels((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setLevels((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
  }, []);

  const handleReset = useCallback(() => {
    setLevels([...DEFAULT_ORG_LEVELS]);
  }, []);

  const handleSave = useCallback(() => {
    // 空ラベルを除去してレベル番号を振り直し
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
            この案件で使用する役職階層を定義します。上から順に高い役職になります。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {levels.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-8 text-center text-xs text-muted-foreground font-mono shrink-0">
                L{entry.level}
              </span>
              <Input
                value={entry.label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder="例: 部長"
                className="flex-1 h-9"
              />
              <div className="flex gap-0.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === levels.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemove(index)}
                  disabled={levels.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
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
