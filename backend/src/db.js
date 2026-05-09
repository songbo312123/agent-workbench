import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function initDb(dbPath) {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const m1 = readFileSync(join(__dirname, "db", "migrations", "001_initial_schema.sql"), "utf8");
  const m2 = readFileSync(join(__dirname, "db", "migrations", "002_provider_configs.sql"), "utf8");
  db.exec(m1);
  db.exec(m2);
  try {
    db.exec("ALTER TABLE provider_configs ADD COLUMN api_key TEXT NOT NULL DEFAULT ''");
  } catch {
    // Column already exists.
  }

  return db;
}

export function getDb() {
  return db;
}
