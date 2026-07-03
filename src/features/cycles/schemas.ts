import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createCycleSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  code: z
    .string()
    .min(1, "Code requis")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Code invalide"),
  description: z.string().max(500).optional(),
  order: z.coerce.number().int().min(1).max(99).default(1),
  establishment_id: z.string().uuid().optional(),
});

export const updateCycleSchema = createCycleSchema.partial();

export const createLevelSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  code: z
    .string()
    .min(1, "Code requis")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Code invalide"),
  cycle_id: z.string().uuid("Cycle invalide"),
  order: z.coerce.number().int().min(1).max(99).default(1),
  establishment_id: z.string().uuid().optional(),
});

export const updateLevelSchema = createLevelSchema.partial();

export const listCyclesSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
});

export const listLevelsSchema = paginationSchema.extend({
  cycle_id: z.string().uuid().optional(),
  establishment_id: z.string().uuid().optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
export type CreateLevelInput = z.infer<typeof createLevelSchema>;
export type UpdateLevelInput = z.infer<typeof updateLevelSchema>;
export type ListCyclesInput = z.infer<typeof listCyclesSchema>;
export type ListLevelsInput = z.infer<typeof listLevelsSchema>;
