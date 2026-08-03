import { z } from "zod";

export const createDiplomaSchema = z.object({
  student_id: z.string().uuid("Élève invalide"),
  name: z.string().min(2, "Nom du diplôme requis").max(200),
  issue_date: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
});

export const listDiplomasSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
});

export type CreateDiplomaInput = z.infer<typeof createDiplomaSchema>;
export type ListDiplomasInput = z.infer<typeof listDiplomasSchema>;
