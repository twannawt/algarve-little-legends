import { hasDatabase } from "../db";
import type { IStorage } from "./interface";
import { PgStorage } from "./pg";
import { MemStorage } from "./mem";

export type { IStorage } from "./interface";
export { BasePlaceStorage } from "./base";
export { PgStorage } from "./pg";
export { MemStorage } from "./mem";

// ============================================================
// Export the storage instance — auto-selects based on DATABASE_URL
// ============================================================

export const storage: IStorage = hasDatabase() ? new PgStorage() : new MemStorage();
