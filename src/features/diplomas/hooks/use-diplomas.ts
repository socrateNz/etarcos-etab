"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listDiplomasAction,
  createDiplomaAction,
  deleteDiplomaAction,
} from "../actions";
import type { CreateDiplomaInput, ListDiplomasInput } from "../schemas";

export const diplomasKeys = {
  all: ["diplomas-module"] as const,
  list: (params?: Partial<ListDiplomasInput>, estId?: string) =>
    [...diplomasKeys.all, "list", params, estId] as const,
};

export function useDiplomas(params: Partial<ListDiplomasInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: diplomasKeys.list(params, estId),
    queryFn: async () => {
      const result = await listDiplomasAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateDiploma() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateDiplomaInput) =>
      createDiplomaAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diplomasKeys.all });
      toast.success("Diplôme enregistré avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDiploma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDiplomaAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diplomasKeys.all });
      toast.success("Diplôme supprimé.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
