"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listNewsPostsAction,
  createNewsPostAction,
  updateNewsPostAction,
  deleteNewsPostAction,
} from "../actions";
import type { CreateNewsPostInput, UpdateNewsPostInput, ListNewsPostsInput } from "../schemas";

export const newsKeys = {
  all: ["news-module"] as const,
  posts: (params?: Partial<ListNewsPostsInput>, estId?: string) =>
    [...newsKeys.all, "posts", params, estId] as const,
};

export function useNewsPosts(params: Partial<ListNewsPostsInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: newsKeys.posts(params, estId),
    queryFn: async () => {
      const result = await listNewsPostsAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateNewsPost() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateNewsPostInput) =>
      createNewsPostAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      toast.success("Annonce publiée avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateNewsPost() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: UpdateNewsPostInput) =>
      updateNewsPostAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      toast.success("Annonce modifiée avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteNewsPost() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (postId: string) =>
      deleteNewsPostAction(postId, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      toast.success("Annonce supprimée.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
