import type { Subject as DbSubject } from "@/types/database";

export interface Subject extends DbSubject {
  track_id?: string | null;
}

export interface SubjectWithTrack extends Subject {
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
