import { z } from "zod";

export const gradeEntryItemSchema = z.object({
  grade_id: z.string().optional(),
  student_id: z.string().uuid(),
  value: z.coerce.number().min(0, "Note min 0"),
  comment: z.string().optional().nullable(),
});

export const saveGradesSchema = z.object({
  classroom_id: z.string().uuid("Classe invalide"),
  subject_id: z.string().uuid("Matière invalide"),
  period: z.string().min(1, "Période académique requise"), // 'T1', 'T2', 'T3', 'S1', 'S2'
  type: z.enum(["test", "exam", "homework", "oral", "practical"]).default("test"),
  coefficient: z.coerce.number().positive("Coefficient invalide").default(1.00),
  max_value: z.coerce.number().positive("Note maximale invalide").default(20.00),
  grades: z.array(gradeEntryItemSchema),
});

export const listGradesSchema = z.object({
  classroom_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  period: z.string(),
  type: z.enum(["test", "exam", "homework", "oral", "practical"]),
});

export type SaveGradesInput = z.infer<typeof saveGradesSchema>;
export type ListGradesInput = z.infer<typeof listGradesSchema>;
export type GradeEntryItem = z.infer<typeof gradeEntryItemSchema>;

/** Local-only type for the grade input state — allows null value for un-graded (draft) rows */
export type LocalGradeItem = {
  grade_id?: string;
  student_id: string;
  value: number | null;
  comment?: string | null;
};
