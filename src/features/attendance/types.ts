export interface Attendance {
  id: string;
  establishment_id: string;
  student_id: string;
  classroom_id: string;
  subject_id: string | null;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "excused";
  justification: string | null;
  recorded_by: string;
  created_at: string;
}

export interface AttendanceWithRelations extends Attendance {
  student?: {
    id: string;
    student_number: string;
    user?: {
      name: string;
    } | null;
  } | null;
}

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}
