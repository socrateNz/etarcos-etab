import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createDisciplineRecordSchema = z.object({
  student_id: z.string().uuid("Élève invalide"),
  level: z.enum(["warning", "reprimand", "suspension", "exclusion"]).default("warning"),
  reason: z.string().min(2, "Veuillez décrire le motif de l'incident").max(1000),
  decision: z.string().max(1000).optional().nullable().or(z.literal("")),
  incident_date: z.string().min(1, "Date de l'incident requise"),
  duration_days: z.coerce.number().int().positive("Durée invalide").optional().nullable(),
  establishment_id: z.string().uuid().optional(),
});

export const updateDisciplineRecordSchema = createDisciplineRecordSchema.partial();

export const listDisciplineRecordsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  level: z.enum(["warning", "reprimand", "suspension", "exclusion"]).optional(),
});

export type CreateDisciplineRecordInput = z.infer<typeof createDisciplineRecordSchema>;
export type UpdateDisciplineRecordInput = z.infer<typeof updateDisciplineRecordSchema>;
export type ListDisciplineRecordsInput = z.infer<typeof listDisciplineRecordsSchema>;
