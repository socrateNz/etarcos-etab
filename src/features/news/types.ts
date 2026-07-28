import type { NewsPost as DbNewsPost } from "@/types/database";

export interface NewsPost extends DbNewsPost {}

export interface NewsPostWithAuthor extends NewsPost {
  author?: {
    id: string;
    name: string;
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
  pageSize: number;
}
