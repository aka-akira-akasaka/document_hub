"use client";

import { useState } from "react";
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

interface StakeholderFormProps {
  dealId: string;
  stakeholder?: Stakeholder;
  onClose: () => void;
  parentOptions: { id: string; name: string }[];
}

export function StakeholderForm({
  dealId,
  stakeholder,
  onClose,
  parentOptions,
}: StakeholderFormProps) {
  const isEdit = !!stakeholder;
  const addStakeholder = useStakeholderStore((s) => s.addStakeholder);
  const updateStakeholder = useStakeholderStore((s) => s.updateStakeholder);

  const [name, setName] = useState(stakeholder?.name ?? "");
  const [department, setDepartment] = useState(stakeholder?.department ?? "");
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
  const [relationshipOwner, setRelationshipOwner] = useState(
    stakeholder?.relationshipOwner ?? ""
  );
  const [parentId, setParentId] = useState(stakeholder?.parentId ?? "");
  const [email, setEmail] = useState(stakeholder?.email ?? "");
  const [phone, setPhone] = useState(stakeholder?.phone ?? "");
  const [notes, setNotes] = useState(stakeholder?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      dealId,
      name: name.trim(),
      department: department.trim(),
      title: title.trim(),
      roleInDeal,
      influenceLevel,
      attitude,
      relationshipOwner: relationshipOwner.trim(),
      parentId: parentId || null,
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    };

    if (isEdit && stakeholder) {
      updateStakeholder(stakeholder.id, dealId, data);
    } else {
      addStakeholder(data);
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sh-dept">部署</Label>
          <Input
            id="sh-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="例: 経営企画部"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sh-title">役職</Label>
          <Input
            id="sh-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 部長"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>案件での役割</Label>
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
        <Label htmlFor="sh-notes">メモ</Label>
        <Input
          id="sh-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="自由記述"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">{isEdit ? "更新" : "追加"}</Button>
      </div>
    </form>
  );
}
