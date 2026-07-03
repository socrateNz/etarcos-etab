import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createExpenseSchema = z.object({
  category: z.string().min(2, "Catégorie trop courte").max(100),
  description: z.string().min(2, "Description trop courte").max(500),
  amount: z.coerce.number().positive("Montant de dépense invalide"),
  expense_date: z.string().min(1, "Date de dépense requise"),
  receipt_url: z.string().optional().nullable().or(z.literal("")),
  establishment_id: z.string().uuid().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  category: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesInput = z.infer<typeof listExpensesSchema>;
