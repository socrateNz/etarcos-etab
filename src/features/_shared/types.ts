import type { ComponentType } from "react";
import type { ModuleKey, ActionKey } from "@/types/permissions";

/**
 * Structure standard d'un module feature (Phase 2+).
 * Chaque dossier `src/features/<module>/` doit exposer ces artefacts.
 */
export interface FeatureModuleStructure {
  key: ModuleKey;
  components?: Record<string, ComponentType>;
  schemas?: Record<string, unknown>;
  hooks?: Record<string, (...args: unknown[]) => unknown>;
  services?: Record<string, unknown>;
  types?: Record<string, unknown>;
}

export interface ModuleAction {
  key: ActionKey;
  label: string;
}
