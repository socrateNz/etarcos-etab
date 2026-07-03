import { create } from "zustand";

interface Modal {
  id: string;
  isOpen: boolean;
  data?: unknown;
}

interface UIStore {
  // Modals
  modals: Modal[];
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => unknown;

  // Global loading
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;

  // Command palette
  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  // Notifications panel
  isNotificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // Search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Modals
  modals: [],
  openModal: (id, data) => {
    const { modals } = get();
    const exists = modals.find((m) => m.id === id);
    if (exists) {
      set({
        modals: modals.map((m) =>
          m.id === id ? { ...m, isOpen: true, data } : m
        ),
      });
    } else {
      set({ modals: [...modals, { id, isOpen: true, data }] });
    }
  },
  closeModal: (id) => {
    set({
      modals: get().modals.map((m) =>
        m.id === id ? { ...m, isOpen: false } : m
      ),
    });
  },
  isModalOpen: (id) => get().modals.find((m) => m.id === id)?.isOpen ?? false,
  getModalData: (id) => get().modals.find((m) => m.id === id)?.data,

  // Loading
  isLoading: false,
  loadingMessage: "",
  setLoading: (loading, message = "") =>
    set({ isLoading: loading, loadingMessage: message }),

  // Command palette
  isCommandOpen: false,
  setCommandOpen: (open) => set({ isCommandOpen: open }),
  toggleCommand: () => set((state) => ({ isCommandOpen: !state.isCommandOpen })),

  // Notifications
  isNotificationsOpen: false,
  setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),

  // Search
  globalSearch: "",
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));
