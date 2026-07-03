import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createFeeCategorySchema = z.object({
  name: z.string().min(2, "Nom trop court").max(200),
  description: z.string().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().positive("Montant invalide"),
  level_id: z.string().uuid("Niveau invalide").optional().nullable().or(z.literal("")),
  is_mandatory: z.boolean().default(true),
  establishment_id: z.string().uuid().optional(),
});

export const createPaymentSchema = z.object({
  student_id: z.string().uuid("Élève invalide"),
  fee_category_id: z.string().uuid("Frais invalides"),
  amount_paid: z.coerce.number().positive("Montant versé invalide"),
  payment_method: z.enum(["cash", "transfer", "check", "mobile_money", "card"]).default("cash"),
  notes: z.string().optional().nullable().or(z.literal("")),
  due_date: z.string().optional().nullable().or(z.literal("")),
  establishment_id: z.string().uuid().optional(),
});

export const updatePaymentSchema = z.object({
  amount_paid: z.coerce.number().positive("Montant versé invalide"),
  payment_method: z.enum(["cash", "transfer", "check", "mobile_money", "card"]),
  status: z.enum(["pending", "paid", "partial", "overdue", "cancelled"]),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const listPaymentsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  status: z.enum(["pending", "paid", "partial", "overdue", "cancelled"]).optional(),
});

export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>;
