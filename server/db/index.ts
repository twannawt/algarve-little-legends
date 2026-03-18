import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: InstanceType<typeof Pool> | null = null;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }
  return db;
}

export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function initDatabase() {
  if (!hasDatabase()) {
    console.log("No DATABASE_URL set — using in-memory storage");
    return;
  }

  const db = getDb();

  // Create tables if they don't exist
  await pool!.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      site_name TEXT,
      categories TEXT[] NOT NULL DEFAULT '{}',
      cooked BOOLEAN NOT NULL DEFAULT false,
      kid_favorite BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      place_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visited (
      place_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );
  `);

  console.log("PostgreSQL database initialized");
}
