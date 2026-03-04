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
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useCustomTemplateStore } from "@/stores/custom-template-store";
import { extractTemplate } from "@/lib/extract-template";
import { toast } from "sonner";
import type { OrgGroup } from "@/types/org-group";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY_GROUPS: OrgGroup[] = [];
const EMPTY_STAKEHOLDERS: Stakeholder[] = [];

interface SaveTemplateDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveTemplateDialog({
  dealId,
  open,
  onOpenChange,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const stakeholders = useStakeholderStore(
    (s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS
  );
  const orgLevels = useStakeholderStore(
    (s) => s.orgLevelConfigByDeal[dealId] ?? []
  );
  const addTemplate = useCustomTemplateStore((s) => s.addTemplate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const template = extractTemplate(
      name.trim(),
      description.trim(),
      orgGroups,
      stakeholders,
      orgLevels
    );
    addTemplate(template);
    toast.success(`テンプレート「${name.trim()}」を保存しました`);
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>テンプレートとして保存</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">テンプレート名 *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 自社用銀行テンプレート"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-desc">説明</Label>
            <Input
              id="template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="テンプレートの概要"
            />
          </div>

          <div className="rounded-md bg-gray-50 p-3 text-sm text-muted-foreground">
            <p>保存される内容:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>{orgGroups.length} 部署</li>
              <li>{stakeholders.length} 人</li>
              <li>{orgLevels.length} 役職レベル</li>
            </ul>
            <p className="mt-2 text-xs">
              ※ 個人名はプレースホルダーに置換されます
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
