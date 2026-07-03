import type { Room as DbRoom } from "@/types/database";

export interface Room extends DbRoom {}

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
