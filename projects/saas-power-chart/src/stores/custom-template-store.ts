import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DealTemplate } from "@/lib/deal-templates";

export interface CustomDealTemplate extends DealTemplate {
  /** ユーザーが作成した日時 */
  createdAt: string;
}

interface CustomTemplateState {
  templates: CustomDealTemplate[];
  addTemplate: (template: DealTemplate) => CustomDealTemplate;
  updateTemplate: (id: string, updates: Partial<DealTemplate>) => void;
  deleteTemplate: (id: string) => void;
}

export const useCustomTemplateStore = create<CustomTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (template) => {
        const custom: CustomDealTemplate = {
          ...template,
          id: `custom-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          templates: [...state.templates, custom],
        }));
        return custom;
      },

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== id) return t;
            const merged = { ...t, ...updates };
            // groups/stakeholders が更新された場合はカウントを自動再計算
            if (updates.groups) merged.groupCount = updates.groups.length;
            if (updates.stakeholders) merged.stakeholderCount = updates.stakeholders.length;
            return merged;
          }),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "custom-templates",
    }
  )
);
