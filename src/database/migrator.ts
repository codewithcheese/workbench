import { sql } from "drizzle-orm/sql";
import journal from "./migrations/meta/_journal.json";
import { useDb } from "@/database/client";

export async function runMigrations() {
  const haveMigrationsTable = await useDb().get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  if (!haveMigrationsTable) {
    await useDb().run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
  }
  for (const entry of journal.entries) {
    await applyMigration(entry.idx, entry.tag);
  }
}

async function applyMigration(idx: number, migration: string) {
  // check if migration is already applied
  const checkQuery = `SELECT name FROM migrations WHERE name='${migration}'`;
  console.log("checkQuery", checkQuery);
  const hasMigration = await useDb().get(sql.raw(checkQuery));
  console.log("hasMigration", hasMigration);
  if (!hasMigration) {
    await useDb().transaction(async (tx) => {
      const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
      console.log("Applying migration", migration);
      await tx.run(sql.raw(migrationSql));
      // record migration in migrations table
      await tx.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
    });
  }
}
