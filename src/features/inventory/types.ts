import type { InventoryItem, StockMovement } from "@/types/database";

export interface Item extends InventoryItem {}

export interface Movement extends StockMovement {}

export interface MovementWithRelations extends Movement {
  item?: {
    id: string;
    name: string;
    code: string;
  } | null;
  recorded_by_user?: {
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
