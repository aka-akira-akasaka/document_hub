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
  updateTemplate: (id: string, updates: Partial<Pick<DealTemplate, "name" | "description">>) => void;
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
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
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
