import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(200),
  code: z
    .string()
    .min(1, "Code requis")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Code invalide"),
  coefficient: z.coerce.number().min(0.25, "Min 0.25").max(20).default(1.0),
  color: z.string().max(20).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  track_id: z.string().uuid("Filière invalide").optional().nullable(),
  establishment_id: z.string().uuid().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const listSubjectsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  track_id: z.string().uuid().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
