"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listDocumentsAction,
  createDocumentAction,
  deleteDocumentAction,
} from "../actions";
import type { CreateDocumentInput, ListDocumentsInput } from "../schemas";

export const documentsKeys = {
  all: ["documents-module"] as const,
  list: (params?: Partial<ListDocumentsInput>, estId?: string) =>
    [...documentsKeys.all, "list", params, estId] as const,
};

export function useDocuments(params: Partial<ListDocumentsInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: documentsKeys.list(params, estId),
    queryFn: async () => {
      const result = await listDocumentsAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateDocumentInput) =>
      createDocumentAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      toast.success("Document enregistré avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      toast.success("Document supprimé.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
