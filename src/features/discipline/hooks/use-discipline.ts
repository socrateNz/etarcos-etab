"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDisciplineRecords,
  createDisciplineRecordAction,
  updateDisciplineRecordAction,
  deleteDisciplineRecordAction,
} from "../actions";
import type {
  ListDisciplineRecordsInput,
  CreateDisciplineRecordInput,
  UpdateDisciplineRecordInput,
} from "../schemas";

export const disciplineKeys = {
  all: ["discipline-module"] as const,
  records: (filters: Partial<ListDisciplineRecordsInput>) =>
    [...disciplineKeys.all, "records", filters] as const,
};

export function useDisciplineRecords(filters: Partial<ListDisciplineRecordsInput> = {}) {
  return useQuery({
    queryKey: disciplineKeys.records(filters),
    queryFn: async () => {
      const result = await listDisciplineRecords(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateDisciplineRecordInput) => {
      const result = await createDisciplineRecordAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disciplineKeys.all });
      toast.success("Rapport disciplinaire enregistré.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateDisciplineRecordInput }) => {
      const result = await updateDisciplineRecordAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disciplineKeys.all });
      toast.success("Rapport mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDisciplineRecordAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disciplineKeys.all });
      toast.success("Rapport supprimé de la base.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
