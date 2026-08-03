import { z } from "zod";

export const documentCategoryEnum = z.enum(["report_card", "receipt", "contract", "id_card", "other"]);

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  description: z.string().optional().nullable(),
  file_url: z.string().min(1, "Fichier requis"),
  file_type: z.string().optional().nullable(),
  file_size: z.coerce.number().int().nonnegative().optional().nullable(),
  category: documentCategoryEnum.default("other"),
  is_public: z.boolean().default(false),
});

export const listDocumentsSchema = z.object({
  search: z.string().optional(),
  category: documentCategoryEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
