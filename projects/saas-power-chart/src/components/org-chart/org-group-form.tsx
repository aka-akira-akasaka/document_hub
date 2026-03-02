"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useHistoryStore } from "@/stores/history-store";
import type { OrgGroup, OrgGroupLevel } from "@/types/org-group";
import { ORG_GROUP_LEVEL_LABELS } from "@/types/org-group";

interface OrgGroupFormProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 編集対象（nullなら新規作成） */
  editGroup?: OrgGroup | null;
  /** 新規作成時のデフォルト親グループID */
  defaultParentGroupId?: string | null;
}

/** 親グループのレベルから子グループの適切なレベルを推定 */
function getChildLevel(parentLevel: OrgGroupLevel | null): OrgGroupLevel {
  if (!parentLevel) return "division";
  if (parentLevel === "division") return "section";
  return "team";
}

export function OrgGroupForm({
  dealId,
  open,
  onOpenChange,
  editGroup,
  defaultParentGroupId,
}: OrgGroupFormProps) {
  const isEdit = !!editGroup;
  const addGroup = useOrgGroupStore((s) => s.addGroup);
  const updateGroup = useOrgGroupStore((s) => s.updateGroup);
  const deleteGroup = useOrgGroupStore((s) => s.deleteGroup);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const groups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? []);

  const parentGroup = defaultParentGroupId
    ? groups.find((g) => g.id === defaultParentGroupId)
    : editGroup?.parentGroupId
    ? groups.find((g) => g.id === editGroup.parentGroupId)
    : null;

  const [name, setName] = useState(editGroup?.name ?? "");
  const [level, setLevel] = useState<OrgGroupLevel>(
    editGroup?.level ?? getChildLevel(parentGroup?.level ?? null)
  );
  const [parentGroupId, setParentGroupId] = useState(
    editGroup?.parentGroupId ?? defaultParentGroupId ?? ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    captureSnapshot();
    if (isEdit && editGroup) {
      updateGroup(editGroup.id, dealId, {
        name: name.trim(),
        level,
        parentGroupId: parentGroupId || null,
      });
    } else {
      addGroup({
        dealId,
        name: name.trim(),
        level,
        parentGroupId: parentGroupId || null,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editGroup) return;
    captureSnapshot();
    deleteGroup(editGroup.id, dealId);
    onOpenChange(false);
  };

  // 親グループの選択肢（自分自身と子孫は除外）
  const parentOptions = groups.filter((g) => {
    if (editGroup && g.id === editGroup.id) return false;
    // teamは親になれない
    if (g.level === "team") return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "グループ編集" : "グループ作成"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">グループ名 *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 営業部"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>レベル</Label>
            <Select
              value={level}
              onValueChange={(v) => setLevel(v as OrgGroupLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="division">
                  {ORG_GROUP_LEVEL_LABELS.division}（部）
                </SelectItem>
                <SelectItem value="section">
                  {ORG_GROUP_LEVEL_LABELS.section}（課）
                </SelectItem>
                <SelectItem value="team">
                  {ORG_GROUP_LEVEL_LABELS.team}（係）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>親グループ</Label>
            <Select
              value={parentGroupId || "none"}
              onValueChange={(v) => setParentGroupId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="なし（トップレベル）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし（トップレベル）</SelectItem>
                {parentOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}（{ORG_GROUP_LEVEL_LABELS[g.level]}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center pt-2">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                削除
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit">{isEdit ? "更新" : "作成"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
