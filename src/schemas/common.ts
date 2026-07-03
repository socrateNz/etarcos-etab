// ==================================================
// Etarcos Etab – Zod Schemas (Common)
// ==================================================

import { z } from "zod";

// ============================================
// PAGINATION
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================
// USER PROFILE
// ============================================

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().max(255).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// ESTABLISHMENT
// ============================================

export const createEstablishmentSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(200, "Nom trop long"),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres et tirets)")
    .optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().min(2).max(100).default("Cameroun"),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email invalide").optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
});

export const updateEstablishmentSchema = createEstablishmentSchema.partial();

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>;
export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>;

// ============================================
// ACADEMIC YEAR
// ============================================

export const createAcademicYearSchema = z.object({
  name: z.string().min(4, "Ex: 2024-2025"),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().min(1, "Date de fin requise"),
  is_current: z.boolean().default(false),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "La date de fin doit être après la date de début",
  path: ["end_date"],
});

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

// ============================================
// STUDENT
// ============================================

export const createStudentSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  classroom_id: z.string().uuid("Classe invalide").optional(),
  scholarship_type: z.enum(["none", "partial", "full"]).default("none"),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// ============================================
// PAYMENT
// ============================================

export const createPaymentSchema = z.object({
  student_id: z.string().uuid("Élève invalide"),
  fee_category_id: z.string().uuid("Catégorie invalide"),
  amount_paid: z.coerce.number().positive("Montant invalide"),
  payment_date: z.string().min(1, "Date requise"),
  payment_method: z.enum(["cash", "transfer", "check", "mobile_money", "card"]),
  notes: z.string().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ============================================
// COMMON HELPERS
// ============================================

export const idSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

export const slugSchema = z.object({
  slug: z.string().min(1),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

export type IdInput = z.infer<typeof idSchema>;
