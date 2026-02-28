import { create } from "zustand";

interface UiState {
  sheetOpen: boolean;
  selectedStakeholderId: string | null;
  sheetMode: "view" | "edit" | "create";
  csvImportDialogOpen: boolean;

  openSheet: (
    id: string | null,
    mode: "view" | "edit" | "create"
  ) => void;
  closeSheet: () => void;
  openCsvImport: () => void;
  closeCsvImport: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sheetOpen: false,
  selectedStakeholderId: null,
  sheetMode: "view",
  csvImportDialogOpen: false,

  openSheet: (id, mode) =>
    set({ sheetOpen: true, selectedStakeholderId: id, sheetMode: mode }),
  closeSheet: () =>
    set({ sheetOpen: false, selectedStakeholderId: null, sheetMode: "view" }),
  openCsvImport: () => set({ csvImportDialogOpen: true }),
  closeCsvImport: () => set({ csvImportDialogOpen: false }),
}));
