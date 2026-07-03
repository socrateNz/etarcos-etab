import type { Cycle, Level } from "@/types/database";

export type { Cycle, Level };

export interface CycleWithLevelsCount extends Cycle {
  levels_count?: number;
}

export interface LevelWithCycle extends Omit<Level, "cycle"> {
  cycle?: Pick<Cycle, "id" | "name" | "code">;
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
