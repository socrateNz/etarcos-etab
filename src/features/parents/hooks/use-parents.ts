"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listParents,
  createParentAction,
  updateParentAction,
  deleteParentAction,
} from "../actions";
import type {
  ListParentsInput,
  CreateParentInput,
  UpdateParentInput,
} from "../schemas";

export const parentsKeys = {
  all: ["parents-module"] as const,
  parents: (filters: Partial<ListParentsInput>) =>
    [...parentsKeys.all, "parents", filters] as const,
};

export function useParents(filters: Partial<ListParentsInput> = {}) {
  return useQuery({
    queryKey: parentsKeys.parents(filters),
    queryFn: async () => {
      const result = await listParents(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateParentInput) => {
      const result = await createParentAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentsKeys.all });
      toast.success("Parent d'élève créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateParentInput }) => {
      const result = await updateParentAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentsKeys.all });
      toast.success("Informations parent mises à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteParentAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentsKeys.all });
      toast.success("Parent d'élève supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
