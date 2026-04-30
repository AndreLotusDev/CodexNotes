import { sqliteDb } from "@/lib/db";
import { runMigrations } from "@/lib/migrate";

runMigrations();
console.log(`Migrations are up to date for ${sqliteDb.databasePath}`);
