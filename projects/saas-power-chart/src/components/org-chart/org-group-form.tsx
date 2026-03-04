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
import { Plus, Check } from "lucide-react";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useHistoryStore } from "@/stores/history-store";
import { useUiStore } from "@/stores/ui-store";
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
  const setTierConfig = useOrgGroupStore((s) => s.setTierConfig);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const groups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const tierConfig = useOrgGroupStore((s) => s.tierConfigByDeal[dealId]);
  const stakeholders = useStakeholderStore((s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);

  const [name, setName] = useState(editGroup?.name ?? "");
  const [parentGroupId, setParentGroupId] = useState(
    editGroup?.parentGroupId ?? defaultParentGroupId ?? ""
  );
  const [tier, setTier] = useState(editGroup?.tier ?? 0);

  // インライン種別追加の状態
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [newTierLabel, setNewTierLabel] = useState("");

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
      // tierConfigの最初のエントリに合わせる（存在しない tier 値を避ける）
      const currentConfig = useOrgGroupStore.getState().tierConfigByDeal[dealId];
      setTier(currentConfig && currentConfig.length > 0 ? currentConfig[0].tier : 0);
    }
    setIsAddingTier(false);
    setNewTierLabel("");
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
      const newGroup = addGroup({
        dealId,
        name: name.trim(),
        parentGroupId: effectiveParentGroupId,
        tier,
      });
      // 作成した部署が画面中央に表示されるようスクロール予約
      useUiStore.getState().setScrollToGroup(newGroup.id);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editGroup) return;
    captureSnapshot();
    deleteGroup(editGroup.id, dealId);
    onOpenChange(false);
  };

  // インラインで新しい種別を追加
  const handleAddNewTier = () => {
    const label = newTierLabel.trim();
    if (!label) return;
    const currentConfig = tierConfig ?? [];
    const nextTier = currentConfig.length > 0 ? Math.max(...currentConfig.map((t) => t.tier)) + 1 : 0;
    const newEntry = { tier: nextTier, label };
    setTierConfig(dealId, [...currentConfig, newEntry]);
    setTier(nextTier);
    setNewTierLabel("");
    setIsAddingTier(false);
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

  // tierConfigのソート済みリスト
  const sortedTierConfig = tierConfig
    ? [...tierConfig].sort((a, b) => a.tier - b.tier)
    : [];

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

          {/* 種別セレクター */}
          <div className="space-y-2">
            <Label>種別 *</Label>
            {isAddingTier ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={newTierLabel}
                  onChange={(e) => setNewTierLabel(e.target.value)}
                  placeholder="新しい組織種別名"
                  className="h-9 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewTier();
                    } else if (e.key === "Escape") {
                      setIsAddingTier(false);
                      setNewTierLabel("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0"
                  onClick={handleAddNewTier}
                  disabled={!newTierLabel.trim()}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2 text-xs text-gray-500"
                  onClick={() => { setIsAddingTier(false); setNewTierLabel(""); }}
                >
                  取消
                </Button>
              </div>
            ) : (
              <Select
                value={tier.toString()}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    setIsAddingTier(true);
                    return;
                  }
                  const newTier = Number(v);
                  setTier(newTier);
                  // tier > 0 はネスト不可なので親部署をリセット
                  if (newTier > 0) setParentGroupId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="種別を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedTierConfig.map((t) => (
                    <SelectItem key={t.tier} value={t.tier.toString()}>
                      {t.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new__" className="text-blue-600">
                    <span className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      新しい組織種別を追加
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {sortedTierConfig.length > 0 && !isAddingTier && (
              <p className="text-xs text-muted-foreground">
                {tier > 0
                  ? "この種別は組織図の上段に配置されます"
                  : "通常の部署としてレイアウトされます"}
              </p>
            )}
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
