import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createLessonSchema = z.object({
  classroom_id: z.string().uuid("Classe invalide"),
  subject_id: z.string().uuid("Matière invalide"),
  teacher_id: z.string().uuid("Enseignant invalide"),
  room_id: z.string().uuid("Salle invalide").optional().nullable().or(z.literal("")),
  day_of_week: z.coerce.number().int().min(1, "Jour invalide").max(7, "Jour invalide"),
  start_time: z.string().regex(timePattern, "Format heure de début invalide (HH:MM)"),
  end_time: z.string().regex(timePattern, "Format heure de fin invalide (HH:MM)"),
  establishment_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
}).refine((data) => {
  const [startHour, startMin] = data.start_time.split(":").map(Number);
  const [endHour, endMin] = data.end_time.split(":").map(Number);
  const startVal = startHour! * 60 + startMin!;
  const endVal = endHour! * 60 + endMin!;
  return endVal > startVal;
}, {
  message: "L'heure de fin doit être strictement après l'heure de début.",
  path: ["end_time"],
});

export const updateLessonSchema = createLessonSchema.partial();

export const listLessonsSchema = z.object({
  establishment_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ListLessonsInput = z.infer<typeof listLessonsSchema>;
