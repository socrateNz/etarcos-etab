import type { IdCard as DbIdCard } from "@/types/database";

export interface IdCard extends DbIdCard {}

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
