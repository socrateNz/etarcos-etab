"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listExpenses,
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "../actions";
import type {
  ListExpensesInput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "../schemas";

export const expensesKeys = {
  all: ["expenses-module"] as const,
  expenses: (filters: Partial<ListExpensesInput>) =>
    [...expensesKeys.all, "expenses", filters] as const,
};

export function useExpenses(filters: Partial<ListExpensesInput> = {}) {
  return useQuery({
    queryKey: expensesKeys.expenses(filters),
    queryFn: async () => {
      const result = await listExpenses(filters);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateExpenseInput) => {
      const result = await createExpenseAction(values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesKeys.all });
      toast.success("Dépense enregistrée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateExpenseInput }) => {
      const result = await updateExpenseAction(id, values);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesKeys.all });
      toast.success("Dépense mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteExpenseAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesKeys.all });
      toast.success("Dépense supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
