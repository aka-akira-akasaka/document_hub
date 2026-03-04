"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEAL_TEMPLATES, type DealTemplate } from "@/lib/deal-templates";
import { useCustomTemplateStore, type CustomDealTemplate } from "@/stores/custom-template-store";
import { TemplateEditor } from "@/components/settings/template-editor";
import { Landmark, Building, FileText, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const PRESET_ICONS: Record<string, React.ElementType> = {
  bank: Landmark,
  "business-company": Building,
};

interface TemplateManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateManagement({ open, onOpenChange }: TemplateManagementProps) {
  const customTemplates = useCustomTemplateStore((s) => s.templates);
  const addTemplate = useCustomTemplateStore((s) => s.addTemplate);
  const deleteTemplate = useCustomTemplateStore((s) => s.deleteTemplate);

  const [editorTarget, setEditorTarget] = useState<CustomDealTemplate | null>(null);

  const presets = DEAL_TEMPLATES.filter((t) => t.id !== "blank");

  // プリセットまたはカスタムテンプレートを複製
  const handleDuplicate = (template: DealTemplate) => {
    const duplicated = addTemplate({
      ...template,
      name: `${template.name} のコピー`,
    });
    toast.success(`「${duplicated.name}」を作成しました`);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate(id);
    toast.success(`「${name}」を削除しました`);
  };

  const handleOpenEditor = (template: CustomDealTemplate) => {
    setEditorTarget(template);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>テンプレート管理</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            <p className="text-sm text-muted-foreground">
              案件作成時に使用するテンプレートを管理します
            </p>

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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="複製"
                        onClick={() => handleDuplicate(t)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
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
                    プリセットの複製、または組織図ツールバーの保存ボタンから作成できます
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
                        title="編集"
                        onClick={() => handleOpenEditor(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="複製"
                        onClick={() => handleDuplicate(t)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        title="削除"
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* テンプレートエディタ */}
      {editorTarget && (
        <TemplateEditor
          template={editorTarget}
          open={!!editorTarget}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditorTarget(null);
          }}
        />
      )}
    </>
  );
}
