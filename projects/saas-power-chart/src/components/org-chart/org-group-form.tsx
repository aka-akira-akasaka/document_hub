"use client";

import { useState, useRef } from "react";
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
import type { OrgGroup } from "@/types/org-group";
import { MAX_GROUP_DEPTH } from "@/lib/constants";

interface OrgGroupFormProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 編集対象（nullなら新規作成） */
  editGroup?: OrgGroup | null;
  /** 新規作成時のデフォルト親グループID */
  defaultParentGroupId?: string | null;
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
  const getGroupDepth = useOrgGroupStore((s) => s.getGroupDepth);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const groups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? []);

  const [name, setName] = useState(editGroup?.name ?? "");
  const [parentGroupId, setParentGroupId] = useState(
    editGroup?.parentGroupId ?? defaultParentGroupId ?? ""
  );

  // ダイアログが開くたびにフォーム状態をリセット
  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    // open が false→true に変わった瞬間
    if (!isEdit) {
      // 新規作成時: defaultParentGroupIdを反映
      if ((defaultParentGroupId ?? "") !== parentGroupId) {
        setParentGroupId(defaultParentGroupId ?? "");
      }
      if (name !== "") {
        setName("");
      }
    }
  }
  prevOpenRef.current = open;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    captureSnapshot();
    if (isEdit && editGroup) {
      updateGroup(editGroup.id, dealId, {
        name: name.trim(),
        parentGroupId: parentGroupId || null,
      });
    } else {
      addGroup({
        dealId,
        name: name.trim(),
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
  const excludeIds = editGroup
    ? new Set([editGroup.id, ...useOrgGroupStore.getState().getDescendantIds(editGroup.id, dealId)])
    : new Set<string>();

  const parentOptions = groups.filter((g) => !excludeIds.has(g.id));

  // 選択中の親グループの深さチェック
  const selectedParentDepth = parentGroupId
    ? getGroupDepth(parentGroupId, dealId)
    : -1;
  const isTooDeep = selectedParentDepth >= MAX_GROUP_DEPTH - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "部署編集" : "部署作成"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">部署名 *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 営業部"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>親部署</Label>
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
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTooDeep && (
              <p className="text-xs text-orange-600">
                ※ 階層が深すぎます（最大{MAX_GROUP_DEPTH}階層）
              </p>
            )}
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
              <Button type="submit" disabled={isTooDeep}>
                {isEdit ? "更新" : "作成"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
