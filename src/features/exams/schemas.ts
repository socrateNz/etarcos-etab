import { z } from "zod";
import { paginationSchema } from "@/schemas/common";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const examObjectSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(150),
  classroom_id: z.string().uuid("Classe invalide").optional().nullable().or(z.literal("")),
  subject_id: z.string().uuid("Matière invalide"),
  exam_date: z.string().min(1, "Date d'examen requise"),
  start_time: z.string().regex(timePattern, "Heure de début invalide").optional().nullable().or(z.literal("")),
  end_time: z.string().regex(timePattern, "Heure de fin invalide").optional().nullable().or(z.literal("")),
  room_id: z.string().uuid("Salle invalide").optional().nullable().or(z.literal("")),
  max_score: z.coerce.number().positive("Note maximale invalide").default(20.00),
  coefficient: z.coerce.number().positive("Coefficient invalide").default(1.00),
  establishment_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
});

export const createExamSchema = examObjectSchema.refine((data) => {
  if (data.start_time && data.end_time) {
    const [startHour, startMin] = data.start_time.split(":").map(Number);
    const [endHour, endMin] = data.end_time.split(":").map(Number);
    const startVal = startHour! * 60 + startMin!;
    const endVal = endHour! * 60 + endMin!;
    return endVal > startVal;
  }
  return true;
}, {
  message: "L'heure de fin doit être strictement après l'heure de début.",
  path: ["end_time"],
});

export const updateExamSchema = examObjectSchema.partial();

export const listExamsSchema = paginationSchema.extend({
  establishment_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ListExamsInput = z.infer<typeof listExamsSchema>;
