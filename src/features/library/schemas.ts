import { z } from "zod";

export const createBookSchema = z.object({
  title: z.string().min(1, "Titre requis").max(300),
  author: z.string().min(1, "Auteur requis").max(200),
  isbn: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  published_year: z.coerce.number().int().min(1000).max(2100).optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantité minimum 1").default(1),
  location: z.string().optional().nullable(),
});

export const updateBookSchema = createBookSchema.partial().extend({
  id: z.string().uuid(),
});

export const createLoanSchema = z.object({
  book_id: z.string().uuid("Livre requis"),
  borrower_id: z.string().uuid("Emprunteur requis"),
  due_date: z.string().min(1, "Date de retour prévue requise"),
  notes: z.string().optional().nullable(),
});

export const returnLoanSchema = z.object({
  loan_id: z.string().uuid(),
  return_date: z.string().min(1, "Date de retour requise"),
  notes: z.string().optional().nullable(),
});

export const listBooksSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  available_only: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;
export type ListBooksInput = z.input<typeof listBooksSchema>;
