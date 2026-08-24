"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listIdCardsAction,
  createIdCardAction,
  createIdCardsForClassroomAction,
  deleteIdCardAction,
} from "../actions";
import type { BatchCreateIdCardsInput, CreateIdCardInput, ListIdCardsInput } from "../schemas";

export const idCardsKeys = {
  all: ["id-cards-module"] as const,
  list: (params?: Partial<ListIdCardsInput>, estId?: string) =>
    [...idCardsKeys.all, "list", params, estId] as const,
};

export function useIdCards(params: Partial<ListIdCardsInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: idCardsKeys.list(params, estId),
    queryFn: async () => {
      const result = await listIdCardsAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateIdCard() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateIdCardInput) =>
      createIdCardAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: idCardsKeys.all });
      toast.success("Carte scolaire générée avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateIdCardsForClassroom() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: BatchCreateIdCardsInput) =>
      createIdCardsForClassroomAction(values, selectedEstablishmentId || undefined),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: idCardsKeys.all });
      if (result.data) {
        const { created, alreadyIssued } = result.data;
        if (created === 0) {
          toast.info("Toutes les cartes existaient déjà pour cette classe.");
        } else {
          toast.success(
            `${created} carte${created > 1 ? "s" : ""} générée${created > 1 ? "s" : ""}` +
              (alreadyIssued > 0 ? ` (${alreadyIssued} élève${alreadyIssued > 1 ? "s" : ""} avaient déjà une carte).` : ".")
          );
        }
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIdCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIdCardAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: idCardsKeys.all });
      toast.success("Carte scolaire supprimée.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
