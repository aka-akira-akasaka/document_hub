"use client";

import { useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";

interface TitleComboboxProps {
  /** 現在のorgLevel値（数値の文字列） */
  value: string;
  /** orgLevel変更時のコールバック */
  onValueChange: (orgLevel: string, label: string) => void;
  /** 利用可能な役職リスト */
  options: OrgLevelEntry[];
  /** 新しい役職を追加するコールバック */
  onAddOption: (label: string) => void;
}

export function TitleCombobox({
  value,
  onValueChange,
  options,
  onAddOption,
}: TitleComboboxProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    // 重複チェック
    if (options.some((o) => o.label === trimmed)) return;
    onAddOption(trimmed);
    setNewLabel("");
    setIsAdding(false);
  }, [newLabel, options, onAddOption]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      } else if (e.key === "Escape") {
        setIsAdding(false);
        setNewLabel("");
      }
    },
    [handleAdd]
  );

  if (isAdding) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しい役職名"
          className="h-9 text-sm flex-1"
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={handleAdd}
          disabled={!newLabel.trim()}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 px-2 text-xs text-gray-500"
          onClick={() => { setIsAdding(false); setNewLabel(""); }}
        >
          取消
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === "__add_new__") {
          setIsAdding(true);
          return;
        }
        const opt = options.find((o) => o.level.toString() === v);
        onValueChange(v, opt?.label ?? "");
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.level} value={opt.level.toString()}>
            {opt.label}
          </SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-blue-600">
          <span className="flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            新しい役職を追加
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
