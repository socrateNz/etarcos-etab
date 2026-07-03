import type { Classroom as DbClassroom, Level, User } from "@/types/database";

export interface Classroom extends DbClassroom {
  track_id?: string | null;
}

export interface ClassroomWithRelations extends Omit<Classroom, "level" | "main_teacher"> {
  level?: Pick<Level, "id" | "name" | "code"> | null;
  track?: {
    id: string;
    name: string;
    code: string;
  } | null;
  main_teacher?: Pick<User, "id" | "name" | "email"> | null;
  student_count?: number;
}

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
