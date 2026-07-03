import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createTrackSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(150),
  code: z
    .string()
    .min(1, "Code requis")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, "Code invalide"),
  description: z.string().max(500).optional(),
  establishment_id: z.string().uuid().optional(),
});

export const updateTrackSchema = createTrackSchema.partial();

export const listTracksSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type ListTracksInput = z.infer<typeof listTracksSchema>;
