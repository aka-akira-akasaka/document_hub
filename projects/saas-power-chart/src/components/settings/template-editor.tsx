"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Trash2 } from "lucide-react";
import { useCustomTemplateStore, type CustomDealTemplate } from "@/stores/custom-template-store";
import type {
  TemplateGroup,
  TemplateStakeholder,
  TemplateOrgLevel,
  TemplateTierConfig,
} from "@/lib/deal-templates";
import type { RoleInDeal, Attitude, InfluenceLevel } from "@/types/stakeholder";
import {
  ROLE_OPTIONS,
  ROLE_LABELS,
  ATTITUDE_OPTIONS,
  ATTITUDE_LABELS,
  INFLUENCE_LABELS,
} from "@/lib/constants";
import { toast } from "sonner";

interface TemplateEditorProps {
  template: CustomDealTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateEditor({
  template,
  open,
  onOpenChange,
}: TemplateEditorProps) {
  // ローカルstate（保存ボタンでストアに反映）
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [orgLevels, setOrgLevels] = useState<TemplateOrgLevel[]>([...template.orgLevels]);
  const [tierConfig, setTierConfig] = useState<TemplateTierConfig[]>(
    template.tierConfig ? [...template.tierConfig] : []
  );
  const [groups, setGroups] = useState<TemplateGroup[]>(
    template.groups.map((g) => ({ ...g }))
  );
  const [stakeholders, setStakeholders] = useState<TemplateStakeholder[]>(
    template.stakeholders.map((s) => ({ ...s }))
  );

  const updateTemplate = useCustomTemplateStore((s) => s.updateTemplate);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }
    updateTemplate(template.id, {
      name: name.trim(),
      description: description.trim(),
      orgLevels,
      tierConfig: tierConfig.length > 0 ? tierConfig : undefined,
      groups,
      stakeholders,
    });
    toast.success("テンプレートを保存しました");
    onOpenChange(false);
  };

  // --- 役職階層の操作 ---
  const addOrgLevel = () => {
    const nextLevel = orgLevels.length > 0
      ? Math.max(...orgLevels.map((l) => l.level)) + 1
      : 1;
    setOrgLevels([...orgLevels, { level: nextLevel, label: "" }]);
  };
  const updateOrgLevel = (idx: number, label: string) => {
    setOrgLevels(orgLevels.map((l, i) => (i === idx ? { ...l, label } : l)));
  };
  const removeOrgLevel = (idx: number) => {
    setOrgLevels(orgLevels.filter((_, i) => i !== idx));
  };

  // --- 組織種別の操作 ---
  const addTierConfig = () => {
    const nextTier = tierConfig.length > 0
      ? Math.max(...tierConfig.map((t) => t.tier)) + 1
      : 0;
    setTierConfig([...tierConfig, { tier: nextTier, label: "" }]);
  };
  const updateTierConfigLabel = (idx: number, label: string) => {
    setTierConfig(tierConfig.map((t, i) => (i === idx ? { ...t, label } : t)));
  };
  const removeTierConfig = (idx: number) => {
    setTierConfig(tierConfig.filter((_, i) => i !== idx));
  };

  // --- 部署の操作 ---
  const addGroup = () => {
    const refKey = `group-${Date.now()}`;
    setGroups([
      ...groups,
      { refKey, name: "", parentRefKey: null, tier: tierConfig.length > 0 ? tierConfig[0].tier : 0 },
    ]);
  };
  const updateGroupField = (idx: number, field: keyof TemplateGroup, value: string | number | null) => {
    setGroups(groups.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  };
  const removeGroup = (idx: number) => {
    const removedRefKey = groups[idx].refKey;
    // 子グループの親参照をクリア
    const updatedGroups = groups
      .filter((_, i) => i !== idx)
      .map((g) => (g.parentRefKey === removedRefKey ? { ...g, parentRefKey: null } : g));
    setGroups(updatedGroups);
    // 所属するstakeholderのgroupRefKeyをクリア
    setStakeholders(
      stakeholders.map((s) =>
        s.groupRefKey === removedRefKey ? { ...s, groupRefKey: null } : s
      )
    );
  };

  // --- 人物の操作 ---
  const addStakeholder = () => {
    const refKey = `person-${Date.now()}`;
    setStakeholders([
      ...stakeholders,
      {
        refKey,
        name: "",
        title: "",
        department: "",
        roleInDeal: "unknown",
        influenceLevel: 3,
        attitude: "neutral",
        orgLevel: orgLevels.length > 0 ? orgLevels[0].level : 1,
        groupRefKey: null,
        parentRefKey: null,
      },
    ]);
  };
  const updateStakeholderField = (
    idx: number,
    field: keyof TemplateStakeholder,
    value: string | number | null
  ) => {
    setStakeholders(
      stakeholders.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };
  const removeStakeholder = (idx: number) => {
    const removedRefKey = stakeholders[idx].refKey;
    // 部下のparentRefKeyをクリア
    const updated = stakeholders
      .filter((_, i) => i !== idx)
      .map((s) => (s.parentRefKey === removedRefKey ? { ...s, parentRefKey: null } : s));
    setStakeholders(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>テンプレート編集</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="groups">部署 ({groups.length})</TabsTrigger>
            <TabsTrigger value="people">人物 ({stakeholders.length})</TabsTrigger>
          </TabsList>

          {/* --- タブ1: 基本情報 --- */}
          <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="space-y-2">
              <Label>テンプレート名 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="テンプレート名"
              />
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="テンプレートの説明"
              />
            </div>

            {/* 役職階層 */}
            <div className="space-y-2">
              <Label>役職階層</Label>
              <div className="space-y-1.5">
                {orgLevels.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                      {l.level}
                    </span>
                    <Input
                      value={l.label}
                      onChange={(e) => updateOrgLevel(i, e.target.value)}
                      placeholder="役職名"
                      className="h-8 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                      onClick={() => removeOrgLevel(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                onClick={addOrgLevel}
              >
                <Plus className="h-3 w-3" />
                <span>役職を追加</span>
              </button>
            </div>

            {/* 組織種別 */}
            <div className="space-y-2">
              <Label>組織種別</Label>
              <div className="space-y-1.5">
                {tierConfig.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                      {t.tier}
                    </span>
                    <Input
                      value={t.label}
                      onChange={(e) => updateTierConfigLabel(i, e.target.value)}
                      placeholder="種別名"
                      className="h-8 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                      onClick={() => removeTierConfig(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                onClick={addTierConfig}
              >
                <Plus className="h-3 w-3" />
                <span>種別を追加</span>
              </button>
            </div>
          </TabsContent>

          {/* --- タブ2: 部署 --- */}
          <TabsContent value="groups" className="flex-1 overflow-y-auto space-y-3 pr-1">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                部署がありません
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((g, i) => (
                  <div key={g.refKey} className="rounded-lg border bg-white p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={g.name}
                        onChange={(e) => updateGroupField(i, "name", e.target.value)}
                        placeholder="部署名"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                        onClick={() => removeGroup(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {/* 種別 */}
                      {tierConfig.length > 0 && (
                        <Select
                          value={(g.tier ?? 0).toString()}
                          onValueChange={(v) => updateGroupField(i, "tier", Number(v))}
                        >
                          <SelectTrigger className="h-8 text-xs w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tierConfig.map((tc) => (
                              <SelectItem key={tc.tier} value={tc.tier.toString()}>
                                {tc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {/* 親部署 */}
                      <Select
                        value={g.parentRefKey ?? "none"}
                        onValueChange={(v) =>
                          updateGroupField(i, "parentRefKey", v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="親部署なし" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">親部署なし</SelectItem>
                          {groups
                            .filter((other) => other.refKey !== g.refKey)
                            .map((other) => (
                              <SelectItem key={other.refKey} value={other.refKey}>
                                {other.name || "(名称未設定)"}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              onClick={addGroup}
            >
              <Plus className="h-3 w-3" />
              <span>部署を追加</span>
            </button>
          </TabsContent>

          {/* --- タブ3: 人物 --- */}
          <TabsContent value="people" className="flex-1 overflow-y-auto space-y-3 pr-1">
            {stakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                人物がありません
              </p>
            ) : (
              <div className="space-y-2">
                {stakeholders.map((s, i) => (
                  <div key={s.refKey} className="rounded-lg border bg-white p-3 space-y-2">
                    {/* 行1: 名前・役職 */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={s.name}
                        onChange={(e) => updateStakeholderField(i, "name", e.target.value)}
                        placeholder="名前"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={s.title}
                        onChange={(e) => updateStakeholderField(i, "title", e.target.value)}
                        placeholder="役職"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                        onClick={() => removeStakeholder(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {/* 行2: 部署・役割・態度 */}
                    <div className="flex gap-2">
                      {/* 部署 */}
                      <Select
                        value={s.groupRefKey ?? "none"}
                        onValueChange={(v) =>
                          updateStakeholderField(i, "groupRefKey", v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="部署なし" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">部署なし</SelectItem>
                          {groups.map((g) => (
                            <SelectItem key={g.refKey} value={g.refKey}>
                              {g.name || "(名称未設定)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* 役割 */}
                      <Select
                        value={s.roleInDeal}
                        onValueChange={(v) =>
                          updateStakeholderField(i, "roleInDeal", v as RoleInDeal)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs w-[100px]">
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
                      {/* 態度 */}
                      <Select
                        value={s.attitude}
                        onValueChange={(v) =>
                          updateStakeholderField(i, "attitude", v as Attitude)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs w-[90px]">
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
                    {/* 行3: 影響度・orgLevel・上司 */}
                    <div className="flex gap-2">
                      {/* 影響度 */}
                      <Select
                        value={s.influenceLevel.toString()}
                        onValueChange={(v) =>
                          updateStakeholderField(i, "influenceLevel", Number(v) as InfluenceLevel)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {([1, 2, 3, 4, 5] as InfluenceLevel[]).map((lv) => (
                            <SelectItem key={lv} value={lv.toString()}>
                              {lv}: {INFLUENCE_LABELS[lv]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* orgLevel */}
                      {orgLevels.length > 0 && (
                        <Select
                          value={s.orgLevel.toString()}
                          onValueChange={(v) =>
                            updateStakeholderField(i, "orgLevel", Number(v))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orgLevels.map((l) => (
                              <SelectItem key={l.level} value={l.level.toString()}>
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {/* 上司 */}
                      <Select
                        value={s.parentRefKey ?? "none"}
                        onValueChange={(v) =>
                          updateStakeholderField(i, "parentRefKey", v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="上司なし" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">上司なし</SelectItem>
                          {stakeholders
                            .filter((other) => other.refKey !== s.refKey)
                            .map((other) => (
                              <SelectItem key={other.refKey} value={other.refKey}>
                                {other.name || other.title || "(名称未設定)"}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              onClick={addStakeholder}
            >
              <Plus className="h-3 w-3" />
              <span>人物を追加</span>
            </button>
          </TabsContent>
        </Tabs>

        {/* フッター: 保存・キャンセル */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
