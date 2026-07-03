import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DashboardMode = "global" | "single" | "compare";

interface OwnerStore {
  mode: DashboardMode;
  selectedEstablishmentId: string | null;
  compareIds: string[];

  setMode: (mode: DashboardMode) => void;
  setSelectedEstablishmentId: (id: string | null) => void;
  setCompareIds: (ids: string[]) => void;
  toggleCompareId: (id: string) => void;
}

export const useOwnerStore = create<OwnerStore>()(
  persist(
    (set) => ({
      mode: "global",
      selectedEstablishmentId: null,
      compareIds: [],

      setMode: (mode) => set({ mode }),
      setSelectedEstablishmentId: (id) => set({ selectedEstablishmentId: id }),
      setCompareIds: (ids) => set({ compareIds: ids }),
      toggleCompareId: (id) =>
        set((state) => {
          const index = state.compareIds.indexOf(id);
          if (index > -1) {
            return { compareIds: state.compareIds.filter((x) => x !== id) };
          } else {
            return { compareIds: [...state.compareIds, id] };
          }
        }),
    }),
    {
      name: "etarcos-owner-dashboard",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
