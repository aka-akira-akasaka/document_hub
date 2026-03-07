"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ATTITUDE_LABELS,
  ATTITUDE_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  INFLUENCE_LABELS,
} from "@/lib/constants";
import type {
  Stakeholder,
  Attitude,
  RoleInDeal,
  InfluenceLevel,
} from "@/types/stakeholder";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useHistoryStore } from "@/stores/history-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useUiStore } from "@/stores/ui-store";
import { TitleCombobox } from "@/components/org-chart/title-combobox";
import { DepartmentCombobox } from "@/components/org-chart/department-combobox";
import type { OrgGroup } from "@/types/org-group";

const EMPTY_GROUPS: OrgGroup[] = [];

interface StakeholderFormProps {
  dealId: string;
  stakeholder?: Stakeholder;
  onClose: () => void;
  parentOptions: { id: string; name: string }[];
  /** +ボタンからのコンテキストで自動設定されるparentId */
  defaultParentId?: string | null;
  /** 作成後にparentIdをリンクし直す子ノードID（上司追加・中間追加用） */
  childToRelink?: string | null;
  /** +ボタンからのコンテキストで推定されたorgLevel */
  defaultOrgLevel?: number | null;
  /** 削除コールバック（編集モード時のみ） */
  onDelete?: () => void;
}

export function StakeholderForm({
  dealId,
  stakeholder,
  onClose,
  parentOptions,
  defaultParentId,
  childToRelink,
  defaultOrgLevel,
  onDelete,
}: StakeholderFormProps) {
  const isEdit = !!stakeholder;
  const addStakeholder = useStakeholderStore((s) => s.addStakeholder);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);
  const dealOrgLevels = useStakeholderStore((s) => s.orgLevelConfigByDeal[dealId]);
  const setOrgLevels = useStakeholderStore((s) => s.setOrgLevels);
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const addGroup = useOrgGroupStore((s) => s.addGroup);
  const createGroupId = useUiStore((s) => s.createGroupId);
  // 案件に保存済みの階層定義を使用。未設定時は空リスト（+新しい役職を追加のみ表示）
  const orgLevelOptions = dealOrgLevels && dealOrgLevels.length > 0 ? dealOrgLevels : [];

  const [name, setName] = useState(stakeholder?.name ?? "");
  const [title, setTitle] = useState(stakeholder?.title ?? "");
  const [roleInDeal, setRoleInDeal] = useState<RoleInDeal>(
    stakeholder?.roleInDeal ?? "unknown"
  );
  const [influenceLevel, setInfluenceLevel] = useState<InfluenceLevel>(
    stakeholder?.influenceLevel ?? 3
  );
  const [attitude, setAttitude] = useState<Attitude>(
    stakeholder?.attitude ?? "neutral"
  );
  const [mission, setMission] = useState(stakeholder?.mission ?? "");
  const [relationshipOwner, setRelationshipOwner] = useState(
    stakeholder?.relationshipOwner ?? ""
  );
  const [parentId, setParentId] = useState(
    stakeholder?.parentId ?? defaultParentId ?? ""
  );
  const [email, setEmail] = useState(stakeholder?.email ?? "");
  const [phone, setPhone] = useState(stakeholder?.phone ?? "");
  const [notes, setNotes] = useState(stakeholder?.notes ?? "");
  const [orgLevel, setOrgLevel] = useState(
    stakeholder?.orgLevel?.toString()
    ?? defaultOrgLevel?.toString()
    ?? ""
  );
  const [groupId, setGroupId] = useState(stakeholder?.groupId ?? createGroupId ?? "");

  // 新しい部署をインライン追加するコールバック
  const handleAddGroup = useCallback((name: string): string => {
    const newGroup = addGroup({
      dealId,
      name,
      parentGroupId: null,
    });
    return newGroup.id;
  }, [addGroup, dealId]);

  // 役職選択時: titleとorgLevelの両方を更新
  const handleTitleChange = useCallback((newOrgLevel: string, label: string) => {
    setOrgLevel(newOrgLevel);
    setTitle(label);
  }, []);

  // 新しい役職をマスタに追加
  const handleAddTitle = useCallback((label: string) => {
    const currentLevels = [...orgLevelOptions];
    const maxLevel = currentLevels.length > 0
      ? Math.max(...currentLevels.map((l) => l.level))
      : 0;
    const newLevel = maxLevel + 1;
    const newLevels = [...currentLevels, { level: newLevel, label }];
    setOrgLevels(dealId, newLevels);
    // 新しく追加した役職を選択
    setOrgLevel(newLevel.toString());
    setTitle(label);
  }, [orgLevelOptions, setOrgLevels, dealId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !orgLevel) return;

    // departmentはgroupIdから自動導出
    const selectedGroup = groupId ? orgGroups.find((g) => g.id === groupId) : null;
    const derivedDepartment = selectedGroup?.name ?? "";

    const data = {
      dealId,
      name: name.trim(),
      department: derivedDepartment,
      title: title.trim(),
      roleInDeal,
      influenceLevel,
      attitude,
      mission: mission.trim(),
      relationshipOwner: relationshipOwner.trim(),
      parentId: parentId || null,
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      orgLevel: Number(orgLevel),
      groupId: groupId || null,
    };

    captureSnapshot();
    if (isEdit && stakeholder) {
      const updates: Partial<import("@/types/stakeholder").Stakeholder> = { ...data };
      // グループまたは役職階層が変わった場合、新しいグループ/レベルの末尾にsortOrderを設定
      if (data.groupId !== stakeholder.groupId || data.orgLevel !== stakeholder.orgLevel) {
        const allStakeholders = useStakeholderStore.getState().stakeholdersByDeal[dealId] ?? [];
        const newSiblings = allStakeholders.filter(
          (s) => s.groupId === data.groupId && s.orgLevel === data.orgLevel && s.id !== stakeholder.id
        );
        const maxOrder = newSiblings.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);
        updates.sortOrder = maxOrder + 1;
      }
      updateStakeholder(stakeholder.id, dealId, updates);
    } else {
      const newStakeholder = addStakeholder(data);
      // 上司追加・中間追加の場合、元の子ノードを新ノードの部下にリンク
      if (childToRelink) {
        updateStakeholder(childToRelink, dealId, {
          parentId: newStakeholder.id,
        });
      }
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div className="space-y-2">
        <Label htmlFor="sh-name">氏名 *</Label>
        <Input
          id="sh-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 山田太郎"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>役職 *</Label>
        <TitleCombobox
          value={orgLevel}
          onValueChange={handleTitleChange}
          options={orgLevelOptions}
          onAddOption={handleAddTitle}
        />
      </div>

      <div className="space-y-2">
        <Label>組織図での役割</Label>
        <Select
          value={roleInDeal}
          onValueChange={(v) => setRoleInDeal(v as RoleInDeal)}
        >
          <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label>
          影響力: {INFLUENCE_LABELS[influenceLevel]} ({influenceLevel})
        </Label>
        <Slider
          value={[influenceLevel]}
          onValueChange={([v]) => setInfluenceLevel(v as InfluenceLevel)}
          min={1}
          max={5}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label>態度</Label>
        <Select
          value={attitude}
          onValueChange={(v) => setAttitude(v as Attitude)}
        >
          <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label>所属部門グループ</Label>
        <DepartmentCombobox
          value={groupId}
          onValueChange={setGroupId}
          groups={orgGroups}
          onAddGroup={handleAddGroup}
        />
        <p className="text-xs text-muted-foreground">
          部門グループボックス内に配置します
        </p>
      </div>

      <div className="space-y-2">
        <Label>上司</Label>
        <Select
          value={parentId ?? "none"}
          onValueChange={(v) => setParentId(v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="なし" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">なし</SelectItem>
            {parentOptions
              .filter((p) => p.id !== stakeholder?.id)
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sh-owner">関係構築担当者</Label>
        <Input
          id="sh-owner"
          value={relationshipOwner}
          onChange={(e) => setRelationshipOwner(e.target.value)}
          placeholder="自社側の担当者名"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sh-email">メール</Label>
          <Input
            id="sh-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sh-phone">電話</Label>
          <Input
            id="sh-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sh-mission">ミッション</Label>
        <Input
          id="sh-mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="例: DX推進の全社統括"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sh-notes">メモ</Label>
        <Input
          id="sh-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="自由記述"
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        {isEdit && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            削除
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit">{isEdit ? "更新" : "追加"}</Button>
        </div>
      </div>
    </form>
  );
}
