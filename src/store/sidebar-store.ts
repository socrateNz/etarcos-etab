import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarStore {
  isOpen: boolean;
  isCollapsed: boolean;
  activeModule: string | null;
  expandedGroups: string[];

  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setActiveModule: (module: string | null) => void;
  toggleGroup: (group: string) => void;
  expandGroup: (group: string) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isOpen: true,
      isCollapsed: false,
      activeModule: null,
      expandedGroups: ["overview", "academic", "students", "financial", "administration", "resources", "reports", "system"],

      setIsOpen: (open) => set({ isOpen: open }),
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      setActiveModule: (module) => set({ activeModule: module }),
      toggleGroup: (group) => {
        const { expandedGroups } = get();
        const isExpanded = expandedGroups.includes(group);
        set({
          expandedGroups: isExpanded
            ? expandedGroups.filter((g) => g !== group)
            : [...expandedGroups, group],
        });
      },
      expandGroup: (group) => {
        const { expandedGroups } = get();
        if (!expandedGroups.includes(group)) {
          set({ expandedGroups: [...expandedGroups, group] });
        }
      },
    }),
    {
      name: "etarcos-sidebar",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
