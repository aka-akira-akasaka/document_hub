"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { DEAL_TEMPLATES, type DealTemplate } from "@/lib/deal-templates";
import { applyTemplate } from "@/lib/apply-template";
import { flushPendingSync } from "@/lib/supabase-sync";
import { Building2, Landmark, Building, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  "regional-bank": Landmark,
  "mega-bank": Building2,
  "general-company": Building,
  blank: Plus,
};

interface TemplateSelectorProps {
  dealId: string;
}

export function TemplateSelector({ dealId }: TemplateSelectorProps) {
  const [dismissed, setDismissed] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  if (dismissed) return null;

  const handleSelect = async (template: DealTemplate) => {
    if (applyingId) return;
    if (template.id === "blank") {
      setDismissed(true);
      return;
    }
    flushSync(() => setApplyingId(template.id));
    try {
      // deals のDB永続化を保証してからテンプレート適用（RLS: org_groups は deal_id 経由で認可）
      await flushPendingSync();
      applyTemplate(dealId, template);
      // テンプレートで追加されたデータを即座にDB永続化（デバウンス500ms待ちを回避）
      await flushPendingSync();
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-2xl w-full mx-4">
        {applyingId ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-700">
              組織図を構築しています...
            </p>
            <p className="text-xs text-muted-foreground">
              部署とメンバーを配置中
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                テンプレートから始める
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                案件の種類に合わせた組織図をすぐに構築できます
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEAL_TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.id] ?? Building;
                const isBlank = template.id === "blank";

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl border bg-white p-5 text-center transition-all",
                      "hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5",
                      isBlank
                        ? "border-dashed border-gray-300"
                        : "border-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        isBlank
                          ? "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {template.name}
                    </span>
                    {!isBlank && (
                      <span className="text-xs text-muted-foreground">
                        {template.groupCount}部署 · {template.stakeholderCount}名
                      </span>
                    )}
                    {isBlank && (
                      <span className="text-xs text-muted-foreground">
                        手動で構築
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              または左のツールバーから手動で追加
            </p>
          </>
        )}
      </div>
    </div>
  );
}
