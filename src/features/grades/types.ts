import type { Grade as DbGrade } from "@/types/database";

export interface Grade extends DbGrade {}

export interface GradeWithRelations extends Omit<Grade, "student"> {
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
