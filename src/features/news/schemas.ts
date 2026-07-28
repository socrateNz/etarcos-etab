import { z } from "zod";

export const createNewsPostSchema = z.object({
  title: z.string().min(1, "Titre requis").max(300),
  content: z.string().min(1, "Contenu de l'annonce requis"),
  excerpt: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  is_published: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export const updateNewsPostSchema = createNewsPostSchema.partial().extend({
  id: z.string().uuid(),
});

export const listNewsPostsSchema = z.object({
  search: z.string().optional(),
  published_only: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateNewsPostInput = z.infer<typeof createNewsPostSchema>;
export type UpdateNewsPostInput = z.infer<typeof updateNewsPostSchema>;
export type ListNewsPostsInput = z.infer<typeof listNewsPostsSchema>;
