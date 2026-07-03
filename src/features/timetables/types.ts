export interface Lesson {
  id: string;
  establishment_id: string;
  classroom_id: string;
  subject_id: string;
  teacher_id: string;
  room_id: string | null;
  academic_year_id: string;
  day_of_week: number; // 1 = Lundi, 7 = Dimanche
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface LessonWithRelations extends Lesson {
  classroom?: {
    id: string;
    name: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    code: string;
    color: string | null;
  } | null;
  teacher?: {
    id: string;
    name: string;
    email: string;
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
