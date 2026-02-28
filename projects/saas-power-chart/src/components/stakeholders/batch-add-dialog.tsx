"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import {
  ROLE_OPTIONS,
  ROLE_LABELS,
  ATTITUDE_OPTIONS,
  ATTITUDE_LABELS,
  INFLUENCE_LABELS,
} from "@/lib/constants";
import type {
  RoleInDeal,
  Attitude,
  InfluenceLevel,
} from "@/types/stakeholder";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface RowData {
  name: string;
  department: string;
  title: string;
  roleInDeal: RoleInDeal;
  influenceLevel: InfluenceLevel;
  attitude: Attitude;
}

function createEmptyRow(): RowData {
  return {
    name: "",
    department: "",
    title: "",
    roleInDeal: "unknown",
    influenceLevel: 3,
    attitude: "neutral",
  };
}

interface BatchAddDialogProps {
  dealId: string;
}

export function BatchAddDialog({ dealId }: BatchAddDialogProps) {
  const open = useUiStore((s) => s.batchAddDialogOpen);
  const closeBatchAdd = useUiStore((s) => s.closeBatchAdd);
  const addStakeholder = useStakeholderStore((s) => s.addStakeholder);

  const [rows, setRows] = useState<RowData[]>(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const updateRow = useCallback(
    <K extends keyof RowData>(index: number, field: K, value: RowData[K]) => {
      setRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    },
    []
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handleSubmit = () => {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) return;

    for (const row of validRows) {
      addStakeholder({
        dealId,
        name: row.name.trim(),
        department: row.department.trim(),
        title: row.title.trim(),
        roleInDeal: row.roleInDeal,
        influenceLevel: row.influenceLevel,
        attitude: row.attitude,
        relationshipOwner: "",
        parentId: null,
        email: "",
        phone: "",
        notes: "",
      });
    }

    toast.success(`${validRows.length}名のステークホルダーを登録しました`);
    handleClose();
  };

  const handleClose = () => {
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    closeBatchAdd();
  };

  const validCount = rows.filter((r) => r.name.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ステークホルダー一括追加</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.6fr_0.8fr_2rem] gap-2 text-xs font-medium text-gray-500 px-1">
            <span>氏名 *</span>
            <span>部署</span>
            <span>役職</span>
            <span>役割</span>
            <span>影響力</span>
            <span>態度</span>
            <span />
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.6fr_0.8fr_2rem] gap-2 items-center"
            >
              <Input
                value={row.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder="山田太郎"
                className="h-9 text-sm"
              />
              <Input
                value={row.department}
                onChange={(e) => updateRow(i, "department", e.target.value)}
                placeholder="経営企画部"
                className="h-9 text-sm"
              />
              <Input
                value={row.title}
                onChange={(e) => updateRow(i, "title", e.target.value)}
                placeholder="部長"
                className="h-9 text-sm"
              />
              <Select
                value={row.roleInDeal}
                onValueChange={(v) => updateRow(i, "roleInDeal", v as RoleInDeal)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(row.influenceLevel)}
                onValueChange={(v) =>
                  updateRow(i, "influenceLevel", Number(v) as InfluenceLevel)
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([1, 2, 3, 4, 5] as InfluenceLevel[]).map((lv) => (
                    <SelectItem key={lv} value={String(lv)}>
                      {lv} - {INFLUENCE_LABELS[lv]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.attitude}
                onValueChange={(v) => updateRow(i, "attitude", v as Attitude)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTITUDE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ATTITUDE_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add row */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500"
            onClick={addRow}
          >
            <Plus className="h-3 w-3 mr-1" />
            行を追加
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            {validCount}名が入力済み
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={validCount === 0}>
              {validCount}名を一括登録
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
