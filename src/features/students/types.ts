import type { Student as DbStudent, User } from "@/types/database";

export interface Student extends DbStudent {
  track_id?: string | null;
}

export interface StudentWithRelations extends Omit<Student, "user" | "classroom" | "track"> {
  user?: Pick<User, "id" | "name" | "first_name" | "last_name" | "email" | "phone" | "gender" | "date_of_birth" | "address" | "avatar_url" | "is_active"> | null;
  classroom?: {
    id: string;
    name: string;
  } | null;
  track?: {
    id: string;
    name: string;
    code: string;
  } | null;
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
