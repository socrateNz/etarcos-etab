"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listStudents,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
} from "../actions";
import type {
  ListStudentsInput,
  CreateStudentInput,
  UpdateStudentInput,
} from "../schemas";

export const studentsKeys = {
  all: ["students-module"] as const,
  students: (filters: Partial<ListStudentsInput>) =>
    [...studentsKeys.all, "students", filters] as const,
};

export function useStudents(filters: Partial<ListStudentsInput> = {}) {
  return useQuery({
    queryKey: studentsKeys.students(filters),
    queryFn: async () => {
      const result = await listStudents(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateStudentInput) => {
      const result = await createStudentAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success("Élève inscrit avec succès.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateStudentInput }) => {
      const result = await updateStudentAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success("Dossier élève mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteStudentAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success("Élève supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
