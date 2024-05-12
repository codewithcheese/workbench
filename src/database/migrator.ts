import { driz } from "@/database/client";
import { sql } from "drizzle-orm/sql";

const migrations = ["0000_soft_maverick"];

export async function runMigrations() {
  const haveMigrationsTable = await driz.get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  if (!haveMigrationsTable) {
    await driz.run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
  }
  for (const migration of migrations) {
    await applyMigration(migration);
  }
}

async function applyMigration(migration: string) {
  // check if migration is already applied
  const checkQuery = `SELECT name FROM migrations WHERE name='${migration}'`;
  console.log("checkQuery", checkQuery);
  const hasMigration = await driz.get(sql.raw(checkQuery));
  console.log("hasMigration", hasMigration);
  if (!hasMigration) {
    const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
    console.log("Applying migration", migration);
    await driz.run(sql.raw(migrationSql));
    // record migration in migrations table
    await driz.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
  }
}
