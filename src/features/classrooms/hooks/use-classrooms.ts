"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listClassrooms,
  createClassroomAction,
  updateClassroomAction,
  deleteClassroomAction,
  listTeachersOptions,
  listAcademicYearsOptions,
} from "../actions";
import type {
  ListClassroomsInput,
  CreateClassroomInput,
  UpdateClassroomInput,
} from "../schemas";

export const classroomsKeys = {
  all: ["classrooms-module"] as const,
  classrooms: (filters: Partial<ListClassroomsInput>) =>
    [...classroomsKeys.all, "classrooms", filters] as const,
  teachersOptions: (estId?: string) =>
    [...classroomsKeys.all, "teachers-options", estId] as const,
  academicYearsOptions: (estId?: string) =>
    [...classroomsKeys.all, "academic-years-options", estId] as const,
};

export function useClassrooms(filters: Partial<ListClassroomsInput> = {}) {
  return useQuery({
    queryKey: classroomsKeys.classrooms(filters),
    queryFn: async () => {
      const result = await listClassrooms(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useTeachersOptions(establishmentId?: string) {
  return useQuery({
    queryKey: classroomsKeys.teachersOptions(establishmentId),
    queryFn: async () => {
      const result = await listTeachersOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useAcademicYearsOptions(establishmentId?: string) {
  return useQuery({
    queryKey: classroomsKeys.academicYearsOptions(establishmentId),
    queryFn: async () => {
      const result = await listAcademicYearsOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateClassroomInput) => {
      const result = await createClassroomAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classroomsKeys.all });
      toast.success("Classe créée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateClassroomInput }) => {
      const result = await updateClassroomAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classroomsKeys.all });
      toast.success("Classe mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteClassroomAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classroomsKeys.all });
      toast.success("Classe supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
