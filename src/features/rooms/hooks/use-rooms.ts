"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listRooms,
  listRoomsOptions,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
} from "../actions";
import type {
  ListRoomsInput,
  CreateRoomInput,
  UpdateRoomInput,
} from "../schemas";

export const roomsKeys = {
  all: ["rooms-module"] as const,
  rooms: (filters: Partial<ListRoomsInput>) =>
    [...roomsKeys.all, "rooms", filters] as const,
  roomOptions: (estId?: string) =>
    [...roomsKeys.all, "room-options", estId] as const,
};

export function useRooms(filters: Partial<ListRoomsInput> = {}) {
  return useQuery({
    queryKey: roomsKeys.rooms(filters),
    queryFn: async () => {
      const result = await listRooms(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useRoomOptions(establishmentId?: string) {
  return useQuery({
    queryKey: roomsKeys.roomOptions(establishmentId),
    queryFn: async () => {
      const result = await listRoomsOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateRoomInput) => {
      const result = await createRoomAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all });
      toast.success("Salle créée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateRoomInput }) => {
      const result = await updateRoomAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all });
      toast.success("Salle mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRoomAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all });
      toast.success("Salle supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
