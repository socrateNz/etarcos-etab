import type { Diploma as DbDiploma } from "@/types/database";

export interface Diploma extends DbDiploma {}

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
