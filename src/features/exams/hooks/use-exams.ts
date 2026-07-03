"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listExams,
  createExamAction,
  updateExamAction,
  deleteExamAction,
} from "../actions";
import type {
  ListExamsInput,
  CreateExamInput,
  UpdateExamInput,
} from "../schemas";

export const examsKeys = {
  all: ["exams-module"] as const,
  exams: (filters: Partial<ListExamsInput>) =>
    [...examsKeys.all, "exams", filters] as const,
};

export function useExams(filters: Partial<ListExamsInput> = {}) {
  return useQuery({
    queryKey: examsKeys.exams(filters),
    queryFn: async () => {
      const result = await listExams(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateExamInput) => {
      const result = await createExamAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examsKeys.all });
      toast.success("Session d'examen planifiée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateExamInput }) => {
      const result = await updateExamAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examsKeys.all });
      toast.success("Session d'examen mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteExamAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examsKeys.all });
      toast.success("Session d'examen annulée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
