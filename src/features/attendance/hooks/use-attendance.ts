"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClassroomAttendanceAction, saveAttendanceAction } from "../actions";
import type { SaveAttendanceInput } from "../schemas";

export const attendanceKeys = {
  all: ["attendance-module"] as const,
  sheet: (classroomId: string, date: string, subjectId?: string | null) =>
    [...attendanceKeys.all, "sheet", classroomId, date, subjectId] as const,
};

export function useClassroomAttendance(
  classroomId: string,
  date: string,
  subjectId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: attendanceKeys.sheet(classroomId, date, subjectId),
    queryFn: async () => {
      const result = await fetchClassroomAttendanceAction(classroomId, date, subjectId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: enabled && !!classroomId && !!date,
  });
}

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SaveAttendanceInput) => {
      const result = await saveAttendanceAction(values);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: attendanceKeys.sheet(
          variables.classroom_id,
          variables.date,
          variables.subject_id
        ),
      });
      toast.success("Feuille d'appel enregistrée !");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
