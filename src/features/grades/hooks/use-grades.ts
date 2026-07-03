"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClassroomGradesAction, saveGradesAction } from "../actions";
import type { SaveGradesInput } from "../schemas";

export const gradesKeys = {
  all: ["grades-module"] as const,
  grid: (classroomId: string, subjectId: string, period: string, type: string) =>
    [...gradesKeys.all, "grid", classroomId, subjectId, period, type] as const,
};

export function useClassroomGrades(
  classroomId: string,
  subjectId: string,
  period: string,
  type: "test" | "exam" | "homework" | "oral" | "practical",
  enabled = true
) {
  return useQuery({
    queryKey: gradesKeys.grid(classroomId, subjectId, period, type),
    queryFn: async () => {
      const result = await fetchClassroomGradesAction(classroomId, subjectId, period, type);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: enabled && !!classroomId && !!subjectId && !!period && !!type,
  });
}

export function useSaveGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SaveGradesInput) => {
      const result = await saveGradesAction(values);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: gradesKeys.grid(
          variables.classroom_id,
          variables.subject_id,
          variables.period,
          variables.type
        ),
      });
      toast.success("Notes enregistrées avec succès !");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
