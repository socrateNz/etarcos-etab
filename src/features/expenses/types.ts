export interface Expense {
  id: string;
  establishment_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  approved_by: string | null;
  created_by: string;
  created_at: string;
  creator?: {
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
