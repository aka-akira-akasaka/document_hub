"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, Settings2, Table2 } from "lucide-react";
import { useStakeholderStore, type OrgLevelEntry } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
// DEFAULT_ORG_LEVELSは廃止（各案件で独自に定義する運用に統一）
import { toast } from "sonner";
import type { OrgGroup } from "@/types/org-group";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY_STAKEHOLDERS: Stakeholder[] = [];
const EMPTY_GROUPS: OrgGroup[] = [];

interface OrgLevelEditorProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgLevelEditor({ dealId, open, onOpenChange }: OrgLevelEditorProps) {
  const storedLevels = useStakeholderStore((s) => s.orgLevelConfigByDeal[dealId]);
  const setOrgLevels = useStakeholderStore((s) => s.setOrgLevels);
  const stakeholders = useStakeholderStore((s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS);
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);

  // タブ: 設定 or 一覧
  const [viewMode, setViewMode] = useState<"edit" | "table">("edit");

  // ローカル編集状態（ダイアログが開くたびにストアから読み込み）
  const [levels, setLevels] = useState<OrgLevelEntry[]>(() =>
    storedLevels && storedLevels.length > 0 ? [...storedLevels] : []
  );

  // D&D状態
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ダイアログが開くたびにストアから最新を取得
  // Note: Radix Dialog の onOpenChange は外部からの open prop 変更では呼ばれないため useEffect で補完
  useEffect(() => {
    if (open) {
      const current = useStakeholderStore.getState().orgLevelConfigByDeal[dealId];
      setLevels(current && current.length > 0 ? [...current] : []);
      setViewMode("edit");
    }
  }, [open, dealId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
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

  const handleSave = useCallback(() => {
    const cleaned = levels
      .filter((l) => l.label.trim() !== "")
      .map((l, i) => ({ level: i + 1, label: l.label.trim() }));
    setOrgLevels(dealId, cleaned);
    toast.success("階層設定を保存しました");
    onOpenChange(false);
  }, [dealId, levels, setOrgLevels, onOpenChange]);

  // ─── ピボットテーブル用データ ───
  const pivotData = useMemo(() => {
    const savedLevels = storedLevels && storedLevels.length > 0 ? storedLevels : [];

    // 部署列: ルート→子の順にフラット化
    const groupColumns: { id: string; name: string; depth: number }[] = [];
    const addGroupsRecursive = (parentId: string | null, depth: number) => {
      const children = orgGroups
        .filter((g) => g.parentGroupId === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      for (const child of children) {
        groupColumns.push({ id: child.id, name: child.name, depth });
        addGroupsRecursive(child.id, depth + 1);
      }
    };
    addGroupsRecursive(null, 0);

    // 「未所属」列を末尾に追加
    const hasUnassigned = stakeholders.some((s) => !s.groupId);
    if (hasUnassigned) {
      groupColumns.push({ id: "__none__", name: "未所属", depth: 0 });
    }

    // 行データ: 各レベル × 各部署 のセルに人名を格納
    const rows = savedLevels.map((level) => {
      const cells: Record<string, string[]> = {};
      for (const col of groupColumns) {
        const people = stakeholders.filter(
          (s) =>
            s.orgLevel === level.level &&
            (col.id === "__none__" ? !s.groupId : s.groupId === col.id)
        );
        cells[col.id] = people.map((p) => p.name);
      }
      return { level, cells };
    });

    return { columns: groupColumns, rows };
  }, [stakeholders, orgGroups, storedLevels]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          viewMode === "table"
            ? "sm:max-w-[90vw] max-w-[90vw] max-h-[85vh]"
            : "sm:max-w-[420px]"
        }
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>役職階層の設定</DialogTitle>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={viewMode === "edit" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode("edit")}
              >
                <Settings2 className="h-3.5 w-3.5 mr-1" />
                設定
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-3.5 w-3.5 mr-1" />
                一覧
              </Button>
            </div>
          </div>
          <DialogDescription>
            {viewMode === "edit"
              ? "この案件で使用する役職階層を定義します。上から順に高い役職になります。ドラッグで並べ替えできます。"
              : "役職階層 × 部署のマトリクスで人員配置を一覧確認できます。"}
          </DialogDescription>
        </DialogHeader>

        {viewMode === "edit" ? (
          <>
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

            <div className="flex justify-end pt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            {pivotData.columns.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                部署が登録されていません。先に部署を追加してください。
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur border border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                      役職
                    </th>
                    {pivotData.columns.map((col) => (
                      <th
                        key={col.id}
                        className="border border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap bg-muted/50"
                      >
                        {col.depth > 0 && (
                          <span className="text-muted-foreground/40 mr-1">
                            {"└".padStart(col.depth, " ")}
                          </span>
                        )}
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pivotData.rows.map((row) => {
                    const hasAnyPeople = pivotData.columns.some(
                      (col) => (row.cells[col.id]?.length ?? 0) > 0
                    );
                    return (
                      <tr
                        key={row.level.level}
                        className={hasAnyPeople ? "" : "opacity-50"}
                      >
                        <td className="sticky left-0 z-10 bg-white border border-border px-3 py-2 font-medium whitespace-nowrap">
                          <span className="text-xs text-muted-foreground font-mono mr-1.5">
                            L{row.level.level}
                          </span>
                          {row.level.label}
                        </td>
                        {pivotData.columns.map((col) => {
                          const names = row.cells[col.id] ?? [];
                          return (
                            <td
                              key={col.id}
                              className="border border-border px-3 py-2 align-top"
                            >
                              {names.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {names.map((name, i) => (
                                    <span
                                      key={i}
                                      className="inline-block bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 text-xs font-medium"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
