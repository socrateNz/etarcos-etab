import type { LibraryBook, LibraryLoan } from "@/types/database";

export interface Book extends LibraryBook {}

export interface BookWithLoans extends Book {
  active_loans?: number;
}

export interface Loan extends LibraryLoan {}

export interface LoanWithRelations extends Loan {
  book?: {
    id: string;
    title: string;
    author: string;
  } | null;
  borrower?: {
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
