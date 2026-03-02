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
import { useOrgGroupStore } from "@/stores/org-group-store";
import {
  ROLE_OPTIONS,
  ROLE_LABELS,
  ATTITUDE_OPTIONS,
  ATTITUDE_LABELS,
  ATTITUDE_COLORS,
  INFLUENCE_LABELS,
  DEFAULT_ORG_LEVELS,
} from "@/lib/constants";
import type {
  RoleInDeal,
  Attitude,
  InfluenceLevel,
} from "@/types/stakeholder";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface RowData {
  name: string;
  department: string;
  title: string;
  roleInDeal: RoleInDeal;
  influenceLevel: InfluenceLevel;
  attitude: Attitude;
  groupId: string;
}

function createEmptyRow(): RowData {
  return {
    name: "",
    department: "",
    title: "",
    roleInDeal: "unknown",
    influenceLevel: 3,
    attitude: "neutral",
    groupId: "",
  };
}

interface BatchAddDialogProps {
  dealId: string;
}

export function BatchAddDialog({ dealId }: BatchAddDialogProps) {
  const open = useUiStore((s) => s.batchAddDialogOpen);
  const closeBatchAdd = useUiStore((s) => s.closeBatchAdd);
  const addStakeholder = useStakeholderStore((s) => s.addStakeholder);
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? []);

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

    const dealOrgLevels = useStakeholderStore.getState().orgLevelConfigByDeal[dealId];
    const orgLevels = dealOrgLevels && dealOrgLevels.length > 0 ? dealOrgLevels : DEFAULT_ORG_LEVELS;
    const defaultOrgLevel = orgLevels[orgLevels.length - 1].level;

    for (const row of validRows) {
      addStakeholder({
        dealId,
        name: row.name.trim(),
        department: row.department.trim(),
        title: row.title.trim(),
        roleInDeal: row.roleInDeal,
        influenceLevel: row.influenceLevel,
        attitude: row.attitude,
        mission: "",
        relationshipOwner: "",
        parentId: null,
        email: "",
        phone: "",
        notes: "",
        orgLevel: defaultOrgLevel,
        groupId: row.groupId || null,
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
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>ステークホルダー一括追加</DialogTitle>
        </DialogHeader>

        <div className="overflow-auto px-6">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-8">
                  #
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[160px]">
                  氏名 <span className="text-red-400">*</span>
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[140px]">
                  部署
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[120px]">
                  役職
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[140px]">
                  役割
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[100px]">
                  影響力
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[130px]">
                  態度
                </th>
                {orgGroups.length > 0 && (
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap min-w-[140px]">
                    所属グループ
                  </th>
                )}
                <th className="w-10 px-1" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-gray-400 text-center align-middle">
                    {i + 1}
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(i, "name", e.target.value)}
                      placeholder="山田太郎"
                      className="h-9 text-sm border-gray-200 focus:border-blue-400"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Input
                      value={row.department}
                      onChange={(e) => updateRow(i, "department", e.target.value)}
                      placeholder="経営企画部"
                      className="h-9 text-sm border-gray-200 focus:border-blue-400"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Input
                      value={row.title}
                      onChange={(e) => updateRow(i, "title", e.target.value)}
                      placeholder="部長"
                      className="h-9 text-sm border-gray-200 focus:border-blue-400"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Select
                      value={row.roleInDeal}
                      onValueChange={(v) => updateRow(i, "roleInDeal", v as RoleInDeal)}
                    >
                      <SelectTrigger className="h-9 text-sm border-gray-200 w-full">
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
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Select
                      value={String(row.influenceLevel)}
                      onValueChange={(v) =>
                        updateRow(i, "influenceLevel", Number(v) as InfluenceLevel)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm border-gray-200 w-full">
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
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <Select
                      value={row.attitude}
                      onValueChange={(v) => updateRow(i, "attitude", v as Attitude)}
                    >
                      <SelectTrigger className="h-9 text-sm border-gray-200 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTITUDE_OPTIONS.map((a) => (
                          <SelectItem key={a} value={a}>
                            <span className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${ATTITUDE_COLORS[a].bg} ${ATTITUDE_COLORS[a].border} border`}
                              />
                              {ATTITUDE_LABELS[a]}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  {orgGroups.length > 0 && (
                    <td className="px-2 py-1.5 align-middle">
                      <Select
                        value={row.groupId || "none"}
                        onValueChange={(v) => updateRow(i, "groupId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-200 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">なし</SelectItem>
                          {orgGroups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  <td className="px-1 py-1.5 align-middle">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-300 hover:text-red-500"
                      onClick={() => removeRow(i)}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add row */}
          <div className="py-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              行を追加
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
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
