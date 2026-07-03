"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * Raccourci clavier global ⌘K / Ctrl+K pour ouvrir la palette de commandes.
 */
export function useCommandPaletteShortcut() {
  const { setCommandOpen } = useUIStore();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditable) return;

      event.preventDefault();
      setCommandOpen(true);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);
}
