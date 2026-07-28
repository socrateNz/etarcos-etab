import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Nom de l'article requis").max(200),
  code: z.string().min(1, "Code / Référence requis").max(50),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0, "Quantité initiale min 0").default(0),
  unit: z.string().min(1, "Unité requise").default("unité"), // unité, carton, rame, kg...
  location: z.string().optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().uuid(),
});

export const createStockMovementSchema = z.object({
  item_id: z.string().uuid("Article requis"),
  quantity: z.coerce.number().refine((val) => val !== 0, "La quantité doit être différente de 0"),
  type: z.enum(["purchase", "usage", "loss", "return"]).default("purchase"),
  description: z.string().optional().nullable(),
});

export const listItemsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock_only: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ListItemsInput = z.input<typeof listItemsSchema>;
