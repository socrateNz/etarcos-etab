import { z } from "zod";
import {
  createEstablishmentSchema,
  updateEstablishmentSchema,
  paginationSchema,
} from "@/schemas/common";

export { createEstablishmentSchema, updateEstablishmentSchema };
export type {
  CreateEstablishmentInput,
  UpdateEstablishmentInput,
} from "@/schemas/common";

export const establishmentStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "pending",
]);

export const establishmentPlanSchema = z.enum([
  "free",
  "starter",
  "professional",
  "enterprise",
]);

export const listEstablishmentsSchema = paginationSchema.extend({
  status: establishmentStatusSchema.optional(),
  plan: establishmentPlanSchema.optional(),
});

export type ListEstablishmentsInput = z.infer<typeof listEstablishmentsSchema>;

export const updateEstablishmentStatusSchema = z.object({
  status: establishmentStatusSchema,
});

export const updateEstablishmentFormSchema = updateEstablishmentSchema.extend({
  status: establishmentStatusSchema.optional(),
});

export type UpdateEstablishmentFormInput = z.infer<
  typeof updateEstablishmentFormSchema
>;
