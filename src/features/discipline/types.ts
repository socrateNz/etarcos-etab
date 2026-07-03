export interface DisciplineRecord {
  id: string;
  establishment_id: string;
  student_id: string;
  academic_year_id: string;
  level: "warning" | "reprimand" | "suspension" | "exclusion";
  reason: string;
  decision: string | null;
  incident_date: string;
  duration_days: number | null;
  recorded_by: string;
  approved_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DisciplineRecordWithRelations extends DisciplineRecord {
  student?: {
    id: string;
    student_number: string;
    user?: {
      name: string;
    } | null;
    classroom?: {
      id: string;
      name: string;
    } | null;
  } | null;
  recorder?: {
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
  per_page: number;
  total_pages: number;
}
