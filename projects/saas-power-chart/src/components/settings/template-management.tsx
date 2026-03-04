"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEAL_TEMPLATES } from "@/lib/deal-templates";
import { useCustomTemplateStore } from "@/stores/custom-template-store";
import { Landmark, Building, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_ICONS: Record<string, React.ElementType> = {
  bank: Landmark,
  "business-company": Building,
};

export function TemplateManagement() {
  const customTemplates = useCustomTemplateStore((s) => s.templates);
  const updateTemplate = useCustomTemplateStore((s) => s.updateTemplate);
  const deleteTemplate = useCustomTemplateStore((s) => s.deleteTemplate);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const presets = DEAL_TEMPLATES.filter((t) => t.id !== "blank");

  const handleEdit = (id: string, name: string, description: string) => {
    setEditId(id);
    setEditName(name);
    setEditDesc(description);
  };

  const handleSaveEdit = () => {
    if (!editId || !editName.trim()) return;
    updateTemplate(editId, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    toast.success("テンプレートを更新しました");
    setEditId(null);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate(id);
    toast.success(`「${name}」を削除しました`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">テンプレート管理</h2>
        <p className="text-sm text-muted-foreground">
          案件作成時に使用するテンプレートを管理します
        </p>
      </div>

      {/* プリセットテンプレート */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          プリセットテンプレート
        </h3>
        <div className="space-y-2">
          {presets.map((t) => {
            const Icon = PRESET_ICONS[t.id] ?? Building;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {t.groupCount}部署 · {t.stakeholderCount}名
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* カスタムテンプレート */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          カスタムテンプレート
        </h3>
        {customTemplates.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-gray-50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              カスタムテンプレートはまだありません
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              組織図ツールバーの保存ボタンからテンプレートを作成できます
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {customTemplates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.description || "説明なし"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {t.groupCount}部署 · {t.stakeholderCount}名
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEdit(t.id, t.name, t.description)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(t.id, t.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>テンプレート編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">テンプレート名</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">説明</label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditId(null)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveEdit}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
