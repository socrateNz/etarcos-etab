/** Filière / spécialité (table Supabase `tracks`) */
export interface Track {
  id: string;
  establishment_id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackFormData {
  name: string;
  code: string;
  description?: string;
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
