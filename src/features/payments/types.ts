export interface FeeCategory {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  academic_year_id: string;
  level_id: string | null;
  is_mandatory: boolean;
  created_at: string;
  level?: {
    id: string;
    name: string;
  } | null;
}

export interface Payment {
  id: string;
  establishment_id: string;
  student_id: string;
  fee_category_id: string;
  academic_year_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  currency: string;
  status: "pending" | "paid" | "partial" | "overdue" | "cancelled";
  payment_date: string | null;
  due_date: string;
  receipt_number: string | null;
  payment_method: "cash" | "transfer" | "check" | "mobile_money" | "card" | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithRelations extends Payment {
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
  fee_category?: {
    id: string;
    name: string;
  } | null;
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
