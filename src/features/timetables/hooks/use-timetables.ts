"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listLessons,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
} from "../actions";
import type {
  ListLessonsInput,
  CreateLessonInput,
  UpdateLessonInput,
} from "../schemas";

export const timetablesKeys = {
  all: ["timetables-module"] as const,
  lessons: (filters: Partial<ListLessonsInput>) =>
    [...timetablesKeys.all, "lessons", filters] as const,
};

export function useLessons(filters: Partial<ListLessonsInput> = {}) {
  return useQuery({
    queryKey: timetablesKeys.lessons(filters),
    queryFn: async () => {
      const result = await listLessons(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateLessonInput) => {
      const result = await createLessonAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetablesKeys.all });
      toast.success("Cours programmé avec succès.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateLessonInput }) => {
      const result = await updateLessonAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetablesKeys.all });
      toast.success("Cours mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLessonAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetablesKeys.all });
      toast.success("Cours retiré de l'emploi du temps.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
