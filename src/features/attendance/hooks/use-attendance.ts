"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchClassroomAttendanceAction,
  saveAttendanceAction,
  deleteAttendanceSessionAction,
  deleteAttendanceRecordAction,
  getAttendanceLogsAction,
  getTeacherAssignedOptionsAction,
} from "../actions";
import type { SaveAttendanceInput } from "../schemas";

export const attendanceKeys = {
  all: ["attendance-module"] as const,
  sheet: (classroomId: string, date: string, subjectId?: string | null) =>
    [...attendanceKeys.all, "sheet", classroomId, date, subjectId] as const,
  logs: (filters: Record<string, any>) =>
    [...attendanceKeys.all, "logs", filters] as const,
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

export function useDeleteAttendanceSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classroomId,
      date,
      subjectId,
    }: {
      classroomId: string;
      date: string;
      subjectId?: string | null;
    }) => {
      const result = await deleteAttendanceSessionAction(classroomId, date, subjectId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: attendanceKeys.sheet(variables.classroomId, variables.date, variables.subjectId),
      });
      toast.success("Feuille d'appel supprimée !");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      const result = await deleteAttendanceRecordAction(recordId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
      toast.success("Présence supprimée !");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAttendanceLogs(
  filters: {
    classroomId?: string;
    studentId?: string;
    subjectId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  enabled = true
) {
  return useQuery({
    queryKey: attendanceKeys.logs(filters),
    queryFn: async () => {
      const result = await getAttendanceLogsAction(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled,
  });
}

export function useTeacherAssignedOptions() {
  return useQuery({
    queryKey: [...attendanceKeys.all, "assigned-options"],
    queryFn: async () => {
      const result = await getTeacherAssignedOptionsAction();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

