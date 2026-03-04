"use client";

import { useState, useCallback, useMemo } from "react";
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
import type { OrgGroup } from "@/types/org-group";

interface DepartmentComboboxProps {
  /** 現在選択中のgroupId（空文字列 = なし） */
  value: string;
  /** groupId変更時のコールバック */
  onValueChange: (groupId: string) => void;
  /** 利用可能な部署リスト */
  groups: OrgGroup[];
  /** 新しい部署を追加するコールバック（部署名を受け取り、作成されたgroupIdを返す） */
  onAddGroup: (name: string) => string;
}

export function DepartmentCombobox({
  value,
  onValueChange,
  groups,
  onAddGroup,
}: DepartmentComboboxProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  // グループツリーをフラット化（階層インデント付き）
  const groupTree = useMemo(() => {
    const result: { id: string; name: string; depth: number }[] = [];
    const addRecursive = (parentId: string | null, depth: number) => {
      const children = groups
        .filter((g) => g.parentGroupId === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      for (const child of children) {
        result.push({ id: child.id, name: child.name, depth });
        addRecursive(child.id, depth + 1);
      }
    };
    addRecursive(null, 0);
    return result;
  }, [groups]);

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // 重複チェック
    if (groups.some((g) => g.name === trimmed)) return;
    const newGroupId = onAddGroup(trimmed);
    onValueChange(newGroupId);
    setNewName("");
    setIsAdding(false);
  }, [newName, groups, onAddGroup, onValueChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      } else if (e.key === "Escape") {
        setIsAdding(false);
        setNewName("");
      }
    },
    [handleAdd]
  );

  if (isAdding) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しい部署名"
          className="h-9 text-sm flex-1"
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 px-2 text-xs text-gray-500"
          onClick={() => { setIsAdding(false); setNewName(""); }}
        >
          取消
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => {
        if (v === "__add_new__") {
          setIsAdding(true);
          return;
        }
        onValueChange(v === "none" ? "" : v);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="なし（フリー配置）" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">なし（フリー配置）</SelectItem>
        {groupTree.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            <span style={{ paddingLeft: g.depth * 16 }} className="flex items-center gap-1">
              {g.depth > 0 && (
                <span className="text-muted-foreground/50 text-xs">└</span>
              )}
              {g.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-blue-600">
          <span className="flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            新しい部署を追加
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
