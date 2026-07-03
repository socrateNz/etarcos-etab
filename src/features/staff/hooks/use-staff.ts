"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listStaff,
  createStaffAction,
  updateStaffAction,
  deleteStaffAction,
} from "../actions";
import type {
  ListStaffInput,
  CreateStaffInput,
  UpdateStaffInput,
} from "../schemas";

export const staffKeys = {
  all: ["staff-module"] as const,
  staff: (filters: Partial<ListStaffInput>) =>
    [...staffKeys.all, "staff", filters] as const,
};

export function useStaff(filters: Partial<ListStaffInput> = {}) {
  return useQuery({
    queryKey: staffKeys.staff(filters),
    queryFn: async () => {
      const result = await listStaff(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateStaffInput) => {
      const result = await createStaffAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      toast.success("Membre du personnel créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateStaffInput }) => {
      const result = await updateStaffAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      toast.success("Informations mises à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteStaffAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      toast.success("Membre du personnel supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
