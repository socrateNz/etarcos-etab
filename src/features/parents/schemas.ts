import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createParentSchema = z.object({
  // User fields
  name: z.string().min(2, "Nom trop court").max(200),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: z.string().email("Email invalide"),
  phone: z.string().min(4, "Téléphone requis").max(30),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),

  // Parent fields
  relationship: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
  profession: z.string().max(200).optional().nullable(),
  is_emergency_contact: z.boolean().default(false),
  establishment_id: z.string().uuid().optional(),
  student_ids: z.array(z.string().uuid()).optional(),
});

export const updateParentSchema = createParentSchema.partial();

export const listParentsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
export type ListParentsInput = z.infer<typeof listParentsSchema>;
