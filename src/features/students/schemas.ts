import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createStudentSchema = z.object({
  // User profile fields
  name: z.string().min(2, "Nom trop court").max(200),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),

  // Student specific fields
  student_number: z.string().min(1, "Numéro matricule requis").max(30),
  classroom_id: z.string().uuid("Classe invalide").optional().nullable(),
  track_id: z.string().uuid("Filière invalide").optional().nullable(),
  academic_year_id: z.string().uuid().optional(),
  enrollment_date: z.string().optional().nullable(),
  scholarship_type: z.enum(["none", "partial", "full"]).default("none"),
  status: z.enum(["active", "inactive", "suspended", "pending"]).default("active"),
  establishment_id: z.string().uuid().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const listStudentsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  track_id: z.string().uuid().optional(),
  status: z.enum(["active", "inactive", "suspended", "pending"]).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsInput = z.infer<typeof listStudentsSchema>;
