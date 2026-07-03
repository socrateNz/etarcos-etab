import type { Parent as DbParent, User } from "@/types/database";

export interface Parent extends DbParent {}

export interface ParentWithRelations extends Omit<Parent, "user" | "students"> {
  user?: Pick<User, "id" | "name" | "first_name" | "last_name" | "email" | "phone" | "gender" | "date_of_birth" | "address" | "avatar_url" | "is_active"> | null;
  students?: {
    id: string;
    student_number: string;
    user?: {
      name: string;
    } | null;
  }[];
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
