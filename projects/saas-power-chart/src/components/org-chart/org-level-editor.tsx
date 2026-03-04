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
import { Plus, Trash2, GripVertical, Settings2, Table2, Building } from "lucide-react";
import { useStakeholderStore, type OrgLevelEntry } from "@/stores/stakeholder-store";
import { useOrgGroupStore, type TierEntry } from "@/stores/org-group-store";
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
  const storedTiers = useOrgGroupStore((s) => s.tierConfigByDeal[dealId]);
  const setTierConfig = useOrgGroupStore((s) => s.setTierConfig);
  const stakeholders = useStakeholderStore((s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS);
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);

  // タブ: 役職設定 / 組織種別 / 一覧
  const [viewMode, setViewMode] = useState<"levels" | "tiers" | "table">("levels");

  // ── 役職階層のローカル編集状態 ──
  const [levels, setLevels] = useState<OrgLevelEntry[]>(() =>
    storedLevels && storedLevels.length > 0 ? [...storedLevels] : []
  );

  // ── 組織種別のローカル編集状態 ──
  const [tiers, setTiers] = useState<TierEntry[]>(() =>
    storedTiers && storedTiers.length > 0 ? [...storedTiers] : []
  );

  // D&D状態
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ダイアログが開くたびにストアから最新を取得
  useEffect(() => {
    if (open) {
      const currentLevels = useStakeholderStore.getState().orgLevelConfigByDeal[dealId];
      setLevels(currentLevels && currentLevels.length > 0 ? [...currentLevels] : []);
      const currentTiers = useOrgGroupStore.getState().tierConfigByDeal[dealId];
      setTiers(currentTiers && currentTiers.length > 0 ? [...currentTiers] : []);
      setViewMode("levels");
    }
  }, [open, dealId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // ── 役職階層ハンドラ ──
  const handleLevelLabelChange = useCallback((index: number, label: string) => {
    setLevels((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, label } : entry))
    );
  }, []);

  const handleLevelAdd = useCallback(() => {
    setLevels((prev) => {
      const nextLevel = prev.length > 0 ? prev[prev.length - 1].level + 1 : 1;
      return [...prev, { level: nextLevel, label: "" }];
    });
  }, []);

  const handleLevelRemove = useCallback((index: number) => {
    setLevels((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((entry, i) => ({ ...entry, level: i + 1 }));
    });
  }, []);

  // ── 組織種別ハンドラ ──
  const handleTierLabelChange = useCallback((index: number, label: string) => {
    setTiers((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, label } : entry))
    );
  }, []);

  const handleTierAdd = useCallback(() => {
    setTiers((prev) => {
      const nextTier = prev.length > 0 ? Math.max(...prev.map((t) => t.tier)) + 1 : 0;
      return [...prev, { tier: nextTier, label: "" }];
    });
  }, []);

  const handleTierRemove = useCallback((index: number) => {
    setTiers((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((entry, i) => ({ ...entry, tier: i }));
    });
  }, []);

  // ── 共通 D&D ハンドラ ──
  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleLevelDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
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

  const handleTierDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    setTiers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next.map((entry, i) => ({ ...entry, tier: i }));
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  // ── 保存 ──
  const handleSaveLevels = useCallback(() => {
    const cleaned = levels
      .filter((l) => l.label.trim() !== "")
      .map((l, i) => ({ level: i + 1, label: l.label.trim() }));
    setOrgLevels(dealId, cleaned);
    toast.success("役職階層を保存しました");
    onOpenChange(false);
  }, [dealId, levels, setOrgLevels, onOpenChange]);

  const handleSaveTiers = useCallback(() => {
    const cleaned = tiers
      .filter((t) => t.label.trim() !== "")
      .map((t, i) => ({ tier: i, label: t.label.trim() }));
    setTierConfig(dealId, cleaned);
    toast.success("組織種別を保存しました");
    onOpenChange(false);
  }, [dealId, tiers, setTierConfig, onOpenChange]);

  // ── ピボットテーブル用データ ──
  const pivotData = useMemo(() => {
    const savedLevels = storedLevels && storedLevels.length > 0 ? storedLevels : [];

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

    const hasUnassigned = stakeholders.some((s) => !s.groupId);
    if (hasUnassigned) {
      groupColumns.push({ id: "__none__", name: "未所属", depth: 0 });
    }

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

  // ── 共通リスト UI ──
  const renderEditList = (
    items: { label: string }[],
    prefix: string,
    onLabelChange: (i: number, v: string) => void,
    onRemove: (i: number) => void,
    onAdd: () => void,
    onDrop: (e: React.DragEvent, i: number) => void,
    addLabel: string,
    placeholder: string,
  ) => (
    <>
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {items.map((entry, index) => (
          <div
            key={`${prefix}-${index}`}
            className={`flex items-center gap-2 rounded-md px-1 py-1 transition-colors ${
              dragOverIndex === index ? "border-t-2 border-blue-500" : ""
            }`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: dragIndexRef.current === index ? 0.5 : 1,
            }}
          >
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" />
            <span className="w-8 text-center text-xs text-muted-foreground font-mono shrink-0">
              {prefix}{index + (prefix === "T" ? 0 : 1)}
            </span>
            <Input
              value={entry.label}
              onChange={(e) => onLabelChange(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
              onClick={() => onRemove(index)}
              disabled={items.length <= 1}
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
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-1" />
        {addLabel}
      </Button>
    </>
  );

  const descriptions: Record<string, string> = {
    levels: "この案件で使用する役職階層を定義します。上から順に高い役職になります。ドラッグで並べ替えできます。",
    tiers: "部署の種別を定義します。種別ごとに部署を分類し、レイアウトの階層に反映されます。",
    table: "役職階層 × 部署のマトリクスで人員配置を一覧確認できます。",
  };

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
            <DialogTitle>役職・組織の階層設定</DialogTitle>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={viewMode === "levels" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode("levels")}
              >
                <Settings2 className="h-3.5 w-3.5 mr-1" />
                役職
              </Button>
              <Button
                type="button"
                variant={viewMode === "tiers" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode("tiers")}
              >
                <Building className="h-3.5 w-3.5 mr-1" />
                組織種別
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
            {descriptions[viewMode]}
          </DialogDescription>
        </DialogHeader>

        {viewMode === "levels" ? (
          <>
            {renderEditList(
              levels,
              "L",
              handleLevelLabelChange,
              handleLevelRemove,
              handleLevelAdd,
              handleLevelDrop,
              "階層を追加",
              "例: 部長",
            )}
            <div className="flex justify-end pt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSaveLevels}>
                  保存
                </Button>
              </div>
            </div>
          </>
        ) : viewMode === "tiers" ? (
          <>
            {renderEditList(
              tiers,
              "T",
              handleTierLabelChange,
              handleTierRemove,
              handleTierAdd,
              handleTierDrop,
              "種別を追加",
              "例: 会議体",
            )}
            <div className="flex justify-end pt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSaveTiers}>
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
