import { z } from "zod";

export const attendanceItemSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]).default("present"),
  justification: z.string().optional().nullable().or(z.literal("")),
});

export const saveAttendanceSchema = z.object({
  classroom_id: z.string().uuid("Classe invalide"),
  date: z.string().min(1, "Date requise"),
  subject_id: z.string().uuid("Matière invalide").optional().nullable().or(z.literal("")),
  establishment_id: z.string().uuid().optional(),
  attendances: z.array(attendanceItemSchema),
});

export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
export type AttendanceItemInput = z.infer<typeof attendanceItemSchema>;
