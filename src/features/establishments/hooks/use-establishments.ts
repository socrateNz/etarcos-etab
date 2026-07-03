"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listEstablishments,
  getEstablishmentById,
  createEstablishmentAction,
  updateEstablishmentAction,
  deleteEstablishmentAction,
} from "../actions";
import type { ListEstablishmentsInput } from "../schemas";
import type { CreateEstablishmentInput, UpdateEstablishmentFormInput } from "../schemas";

export const establishmentsKeys = {
  all: ["establishments"] as const,
  lists: () => [...establishmentsKeys.all, "list"] as const,
  list: (filters: Partial<ListEstablishmentsInput>) =>
    [...establishmentsKeys.lists(), filters] as const,
  details: () => [...establishmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...establishmentsKeys.details(), id] as const,
};

export function useEstablishments(filters: Partial<ListEstablishmentsInput> = {}) {
  return useQuery({
    queryKey: establishmentsKeys.list(filters),
    queryFn: async () => {
      const result = await listEstablishments(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useEstablishment(id: string | null) {
  return useQuery({
    queryKey: establishmentsKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const result = await getEstablishmentById(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
}

export function useCreateEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateEstablishmentInput) => {
      const result = await createEstablishmentAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentsKeys.all });
      toast.success("Établissement créé avec succès.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: UpdateEstablishmentFormInput;
    }) => {
      const result = await updateEstablishmentAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: establishmentsKeys.all });
      queryClient.invalidateQueries({
        queryKey: establishmentsKeys.detail(data.id),
      });
      toast.success("Établissement mis à jour.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteEstablishmentAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentsKeys.all });
      toast.success("Établissement supprimé.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
