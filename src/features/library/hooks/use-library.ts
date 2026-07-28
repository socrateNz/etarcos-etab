"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOwnerStore } from "@/store/owner-store";
import {
  listBooksAction,
  createBookAction,
  updateBookAction,
  deleteBookAction,
  listLoansAction,
  createLoanAction,
  returnLoanAction,
  getLibraryStatsAction,
} from "../actions";
import type { CreateBookInput, UpdateBookInput, CreateLoanInput, ReturnLoanInput, ListBooksInput } from "../schemas";

export const libraryKeys = {
  all: ["library-module"] as const,
  books: (params?: Partial<ListBooksInput>, estId?: string) =>
    [...libraryKeys.all, "books", params, estId] as const,
  loans: (estId?: string, activeOnly?: boolean) =>
    [...libraryKeys.all, "loans", estId, activeOnly] as const,
  stats: (estId?: string) => [...libraryKeys.all, "stats", estId] as const,
};

export function useLibraryStats(establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: libraryKeys.stats(estId),
    queryFn: async () => {
      const result = await getLibraryStatsAction(estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useBooks(params: Partial<ListBooksInput> = {}, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: libraryKeys.books(params, estId),
    queryFn: async () => {
      const result = await listBooksAction(params, estId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateBookInput) =>
      createBookAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      toast.success("Livre ajouté au catalogue avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: UpdateBookInput) =>
      updateBookAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      toast.success("Livre modifié avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (bookId: string) =>
      deleteBookAction(bookId, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      toast.success("Livre supprimé du catalogue.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLoans(activeOnly?: boolean, establishmentId?: string) {
  const { selectedEstablishmentId } = useOwnerStore();
  const estId = establishmentId || selectedEstablishmentId || undefined;
  return useQuery({
    queryKey: libraryKeys.loans(estId, activeOnly),
    queryFn: async () => {
      const result = await listLoansAction(estId, activeOnly);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: CreateLoanInput) =>
      createLoanAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      toast.success("Prêt enregistré avec succès.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReturnLoan() {
  const queryClient = useQueryClient();
  const { selectedEstablishmentId } = useOwnerStore();
  return useMutation({
    mutationFn: (values: ReturnLoanInput) =>
      returnLoanAction(values, selectedEstablishmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      toast.success("Retour du livre enregistré.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
