export interface Exam {
  id: string;
  establishment_id: string;
  name: string;
  classroom_id: string | null;
  subject_id: string;
  academic_year_id: string;
  period_id: string | null;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  room_id: string | null;
  max_score: number;
  coefficient: number;
  created_at: string;
  updated_at: string;
}

export interface ExamWithRelations extends Exam {
  classroom?: {
    id: string;
    name: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    code: string;
  } | null;
  room?: {
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
