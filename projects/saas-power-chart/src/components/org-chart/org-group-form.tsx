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
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useHistoryStore } from "@/stores/history-store";
import type { OrgGroup } from "@/types/org-group";
import type { Stakeholder } from "@/types/stakeholder";
import { MAX_GROUP_DEPTH } from "@/lib/constants";

const EMPTY_STAKEHOLDERS: Stakeholder[] = [];

const EMPTY_GROUPS: OrgGroup[] = [];

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
  const groups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const stakeholders = useStakeholderStore((s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);

  const [name, setName] = useState(editGroup?.name ?? "");
  const [parentGroupId, setParentGroupId] = useState(
    editGroup?.parentGroupId ?? defaultParentGroupId ?? ""
  );
  const [tier, setTier] = useState(editGroup?.tier ?? 0);

  // ダイアログが開くたびにフォーム状態をリセット
  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    // open が false→true に変わった瞬間
    if (isEdit && editGroup) {
      // 編集時: 現在の部署名・親部署・tierをプリセット
      setName(editGroup.name);
      setParentGroupId(editGroup.parentGroupId ?? "");
      setTier(editGroup.tier ?? 0);
    } else {
      // 新規作成時: defaultParentGroupIdを反映、名前は空にリセット
      setParentGroupId(defaultParentGroupId ?? "");
      setName("");
      setTier(0);
    }
  }
  prevOpenRef.current = open;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    captureSnapshot();
    // tier > 0（上位会議体）はネスト不可
    const effectiveParentGroupId = tier > 0 ? null : (parentGroupId || null);

    if (isEdit && editGroup) {
      const newName = name.trim();
      updateGroup(editGroup.id, dealId, {
        name: newName,
        parentGroupId: effectiveParentGroupId,
        tier,
      });
      // グループ名変更時: 所属メンバーのdepartmentも連動更新
      if (newName !== editGroup.name) {
        const members = stakeholders.filter((s) => s.groupId === editGroup.id);
        for (const member of members) {
          updateStakeholder(member.id, dealId, { department: newName });
        }
      }
    } else {
      addGroup({
        dealId,
        name: name.trim(),
        parentGroupId: effectiveParentGroupId,
        tier,
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
            <Label>種別</Label>
            <Select
              value={tier.toString()}
              onValueChange={(v) => {
                const newTier = Number(v);
                setTier(newTier);
                // 上位会議体はネスト不可なので親部署をリセット
                if (newTier > 0) setParentGroupId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">通常部署</SelectItem>
                <SelectItem value="1">上位会議体（役員会等）</SelectItem>
                <SelectItem value="2">最上位会議体（株主総会等）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {tier > 0
                ? "上位会議体は組織図の上段に配置されます"
                : "通常の部署としてレイアウトされます"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>親部署</Label>
            <Select
              value={parentGroupId || "none"}
              onValueChange={(v) => setParentGroupId(v === "none" ? "" : v)}
              disabled={tier > 0}
            >
              <SelectTrigger className="w-full">
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
            {tier > 0 && (
              <p className="text-xs text-muted-foreground">
                ※ 上位会議体はトップレベルに固定されます
              </p>
            )}
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
