import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

export const createRoomSchema = z.object({
  name: z.string().min(1, "Nom de salle requis").max(100),
  type: z.enum(["classroom", "lab", "library", "gym", "office", "other"]).default("classroom"),
  capacity: z.coerce.number().int().min(1, "Capacité min 1").max(500).default(40),
  floor: z.coerce.number().int().optional().nullable(),
  building: z.string().max(100).optional().nullable(),
  is_available: z.boolean().default(true),
  establishment_id: z.string().uuid().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const listRoomsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  type: z.enum(["classroom", "lab", "library", "gym", "office", "other"]).optional(),
  is_available: z.boolean().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsInput = z.infer<typeof listRoomsSchema>;
