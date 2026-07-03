import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";
import type { Establishment } from "@/types/database";

interface AuthStore {
  user: AuthUser | null;
  activeEstablishment: Establishment | null;

  setUser: (user: AuthUser | null) => void;
  setActiveEstablishment: (establishment: Establishment | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      activeEstablishment: null,

      setUser: (user) => set({ user }),
      setActiveEstablishment: (establishment) =>
        set({ activeEstablishment: establishment }),
      clearAuth: () => set({ user: null, activeEstablishment: null }),
    }),
    {
      name: "etarcos-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeEstablishment: state.activeEstablishment,
      }),
    }
  )
);
