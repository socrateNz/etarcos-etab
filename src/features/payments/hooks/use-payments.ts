"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listFeeCategories,
  createFeeCategoryAction,
  deleteFeeCategoryAction,
  listPayments,
  createPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
} from "../actions";
import type {
  ListPaymentsInput,
  CreateFeeCategoryInput,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "../schemas";

export const paymentsKeys = {
  all: ["payments-module"] as const,
  feeCategories: (estId?: string) =>
    [...paymentsKeys.all, "fee-categories", estId] as const,
  payments: (filters: Partial<ListPaymentsInput>) =>
    [...paymentsKeys.all, "payments", filters] as const,
};

export function useFeeCategories(establishmentId?: string) {
  return useQuery({
    queryKey: paymentsKeys.feeCategories(establishmentId),
    queryFn: async () => {
      const result = await listFeeCategories(establishmentId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateFeeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateFeeCategoryInput) => {
      const result = await createFeeCategoryAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Catégorie de frais créée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFeeCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFeeCategoryAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Catégorie de frais supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePayments(filters: Partial<ListPaymentsInput> = {}) {
  return useQuery({
    queryKey: paymentsKeys.payments(filters),
    queryFn: async () => {
      const result = await listPayments(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreatePaymentInput) => {
      const result = await createPaymentAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Encaissement enregistré avec succès.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdatePaymentInput }) => {
      const result = await updatePaymentAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Transaction mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePaymentAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Reçu de versement annulé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
