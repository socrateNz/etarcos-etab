import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createClassroomSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  code: z
    .string()
    .min(1, "Code requis")
    .max(30)
    .regex(/^[A-Z0-9_-]+$/i, "Code invalide"),
  level_id: z.string().min(1, "Niveau requis"),
  track_id: z.string().optional().nullable(),
  capacity: z.coerce.number().int().min(1, "Capacité min 1").max(200).default(40),
  main_teacher_id: z.string().optional().nullable(),
  academic_year_id: z.string().optional(),
  establishment_id: z.string().optional(),
});

export const updateClassroomSchema = createClassroomSchema.partial();

export const listClassroomsSchema = paginationSchema.extend({
  establishment_id: z.string().optional(),
  level_id: z.string().optional(),
  track_id: z.string().optional(),
  academic_year_id: z.string().optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type ListClassroomsInput = z.infer<typeof listClassroomsSchema>;
