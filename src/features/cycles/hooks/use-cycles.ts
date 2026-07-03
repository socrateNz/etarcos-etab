"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listCycles,
  listLevels,
  listCyclesOptions,
  createCycleAction,
  updateCycleAction,
  deleteCycleAction,
  createLevelAction,
  updateLevelAction,
  deleteLevelAction,
} from "../actions";
import type {
  ListCyclesInput,
  ListLevelsInput,
  CreateCycleInput,
  UpdateCycleInput,
  CreateLevelInput,
  UpdateLevelInput,
} from "../schemas";

export const cyclesKeys = {
  all: ["cycles-module"] as const,
  cycles: (filters: Partial<ListCyclesInput>) =>
    [...cyclesKeys.all, "cycles", filters] as const,
  levels: (filters: Partial<ListLevelsInput>) =>
    [...cyclesKeys.all, "levels", filters] as const,
  cycleOptions: (estId?: string) =>
    [...cyclesKeys.all, "cycle-options", estId] as const,
};

export function useCycles(filters: Partial<ListCyclesInput> = {}) {
  return useQuery({
    queryKey: cyclesKeys.cycles(filters),
    queryFn: async () => {
      const result = await listCycles(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useLevels(filters: Partial<ListLevelsInput> = {}) {
  return useQuery({
    queryKey: cyclesKeys.levels(filters),
    queryFn: async () => {
      const result = await listLevels(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCycleOptions(establishmentId?: string) {
  return useQuery({
    queryKey: cyclesKeys.cycleOptions(establishmentId),
    queryFn: async () => {
      const result = await listCyclesOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateCycleInput) => {
      const result = await createCycleAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Cycle créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateCycleInput }) => {
      const result = await updateCycleAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Cycle mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCycleAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Cycle supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateLevelInput) => {
      const result = await createLevelAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Niveau créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateLevelInput }) => {
      const result = await updateLevelAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Niveau mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLevelAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cyclesKeys.all });
      toast.success("Niveau supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
