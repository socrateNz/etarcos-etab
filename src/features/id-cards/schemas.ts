import { z } from "zod";

export const createIdCardSchema = z.object({
  student_id: z.string().uuid("Élève invalide"),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
});

export const batchCreateIdCardsSchema = z.object({
  classroom_id: z.string().uuid("Classe invalide"),
});

export const listIdCardsSchema = z.object({
  search: z.string().optional(),
  classroom_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
});

export type CreateIdCardInput = z.infer<typeof createIdCardSchema>;
export type BatchCreateIdCardsInput = z.infer<typeof batchCreateIdCardsSchema>;
export type ListIdCardsInput = z.infer<typeof listIdCardsSchema>;
