"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listSubjects,
  listSubjectsOptions,
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
} from "../actions";
import type {
  ListSubjectsInput,
  CreateSubjectInput,
  UpdateSubjectInput,
} from "../schemas";

export const subjectsKeys = {
  all: ["subjects-module"] as const,
  subjects: (filters: Partial<ListSubjectsInput>) =>
    [...subjectsKeys.all, "subjects", filters] as const,
  subjectOptions: (estId?: string) =>
    [...subjectsKeys.all, "subject-options", estId] as const,
};

export function useSubjects(filters: Partial<ListSubjectsInput> = {}) {
  return useQuery({
    queryKey: subjectsKeys.subjects(filters),
    queryFn: async () => {
      const result = await listSubjects(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useSubjectOptions(establishmentId?: string) {
  return useQuery({
    queryKey: subjectsKeys.subjectOptions(establishmentId),
    queryFn: async () => {
      const result = await listSubjectsOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateSubjectInput) => {
      const result = await createSubjectAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.all });
      toast.success("Matière créée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateSubjectInput }) => {
      const result = await updateSubjectAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.all });
      toast.success("Matière mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteSubjectAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.all });
      toast.success("Matière supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
