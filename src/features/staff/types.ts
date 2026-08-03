import type { StaffMember as DbStaffMember, User } from "@/types/database";

export interface StaffMember extends DbStaffMember {}

export interface StaffMemberWithUser extends Omit<StaffMember, "user"> {
  user?: Pick<User, "id" | "name" | "first_name" | "last_name" | "email" | "phone" | "gender" | "date_of_birth" | "address" | "avatar_url" | "is_active" | "requires_password_change"> | null;
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
