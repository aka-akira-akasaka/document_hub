import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutSettingsState {
  /** 同一役職の1行あたり最大列数（デフォルト: 2） */
  maxColumnsPerRow: number;
  setMaxColumnsPerRow: (n: number) => void;
}

export const useLayoutSettingsStore = create<LayoutSettingsState>()(
  persist(
    (set) => ({
      maxColumnsPerRow: 2,
      setMaxColumnsPerRow: (n) =>
        set({ maxColumnsPerRow: Math.max(1, Math.min(10, n)) }),
    }),
    {
      name: "layout-settings",
    }
  )
);
