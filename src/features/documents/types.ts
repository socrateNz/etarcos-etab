import type { SchoolDocument, DocumentCategory } from "@/types/database";

export type { DocumentCategory };
export interface DocumentRecord extends SchoolDocument {}

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
