import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { driz } from "@/database/client";
import { sql } from "drizzle-orm/sql";

const migrations = ["0000_busy_anita_blake"];

export async function runMigrations() {
  // check if migrations table exists
  const rows = await driz.all(sql`SELECT name FROM sqlite_master WHERE type='table';`);
  console.log("Tables", rows);
  for (const record of rows) {
    // drop table
    // @ts-ignore
    await driz.run(sql.raw(`DROP TABLE ${record[0]};`));
  }

  const initialized = await driz.get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  console.log(initialized);
  if (!initialized) {
    // create migrations table
    console.log("Creating migrations table");
    await driz.run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
  }
  for (const migration of migrations) {
    await applyMigration(migration);
  }
}

async function applyMigration(migration: string) {
  // check if migration is already applied
  const hasMigration = await driz.get(sql`SELECT name FROM migrations WHERE name='${migration}';`);
  if (!hasMigration) {
    const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
    console.log("Applying migration", migration);
    await driz.run(sql.raw(migrationSql));
    // record migration in migrations table
    await driz.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
  }
}
