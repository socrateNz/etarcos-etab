"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listTracks,
  listTracksOptions,
  createTrackAction,
  updateTrackAction,
  deleteTrackAction,
} from "../actions";
import type {
  ListTracksInput,
  CreateTrackInput,
  UpdateTrackInput,
} from "../schemas";

export const tracksKeys = {
  all: ["tracks-module"] as const,
  tracks: (filters: Partial<ListTracksInput>) =>
    [...tracksKeys.all, "tracks", filters] as const,
  trackOptions: (estId?: string) =>
    [...tracksKeys.all, "track-options", estId] as const,
};

export function useTracks(filters: Partial<ListTracksInput> = {}) {
  return useQuery({
    queryKey: tracksKeys.tracks(filters),
    queryFn: async () => {
      const result = await listTracks(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useTrackOptions(establishmentId?: string) {
  return useQuery({
    queryKey: tracksKeys.trackOptions(establishmentId),
    queryFn: async () => {
      const result = await listTracksOptions(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateTrackInput) => {
      const result = await createTrackAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tracksKeys.all });
      toast.success("Filière créée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateTrackInput }) => {
      const result = await updateTrackAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tracksKeys.all });
      toast.success("Filière mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTrackAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tracksKeys.all });
      toast.success("Filière supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
