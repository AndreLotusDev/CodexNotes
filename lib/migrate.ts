import { readdirSync } from "fs";
import { join } from "path";
import { sqliteDb } from "@/lib/db";

function ensureMigrationDirectoryExists() {
  const migrationsDir = join(process.cwd(), "migrations");
  readdirSync(migrationsDir);
}

export function runMigrations() {
  ensureMigrationDirectoryExists();
  sqliteDb.runMigrations();
}

export function rollbackMigrations(steps = 1) {
  ensureMigrationDirectoryExists();
  return sqliteDb.rollbackMigrations(steps);
}
