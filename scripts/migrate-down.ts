import { rollbackMigrations } from "@/lib/migrate";

const steps = Number(process.argv[2] ?? "1");
const rolledBack = rollbackMigrations(Number.isFinite(steps) && steps > 0 ? steps : 1);

if (rolledBack.length === 0) {
  console.log("No migrations were rolled back.");
} else {
  console.log(`Rolled back: ${rolledBack.join(", ")}`);
}
