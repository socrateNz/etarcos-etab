import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createStaffSchema = z.object({
  // User profile fields
  name: z.string().min(2, "Nom trop court").max(200),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),

  // Staff specific fields
  employee_number: z.string().min(1, "Numéro d'employé requis").max(30),
  department: z.string().max(100).optional().nullable(),
  position: z.string().min(1, "Poste requis").max(200),
  hire_date: z.string().min(1, "Date d'embauche requise"),
  salary: z.coerce.number().positive("Salaire invalide").optional().nullable(),
  contract_type: z.enum(["permanent", "temporary", "part_time", "intern"]).default("permanent"),
  status: z.enum(["active", "inactive", "suspended", "pending"]).default("active"),
  establishment_id: z.string().uuid().optional(),
  password: z.string().optional().nullable(),
});

export const updateStaffSchema = createStaffSchema.partial();

export const listStaffSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ListStaffInput = z.infer<typeof listStaffSchema>;
