import { sql } from "drizzle-orm/sql";
import journal from "./migrations/meta/_journal.json";
import { useDb } from "@/database/client";
import { seed } from "@/database/seed";

export async function runMigrations(skipSeed = false) {
  const haveMigrationsTable = await useDb().get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  let shouldSeed = false;
  if (!haveMigrationsTable) {
    await useDb().run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
    shouldSeed = true;
  }
  for (const entry of journal.entries) {
    await applyMigration(entry.idx, entry.tag);
  }
  if (shouldSeed && !skipSeed) {
    await seed();
  }
  // console.log("Migrations applied");
}

async function applyMigration(idx: number, migration: string) {
  // check if migration is already applied
  const checkQuery = `SELECT name FROM migrations WHERE name='${migration}'`;
  // console.log("checkQuery", checkQuery);
  const hasMigration = await useDb().get(sql.raw(checkQuery));
  // console.log("hasMigration", hasMigration);
  if (!hasMigration) {
    try {
      await useDb().transaction(async (tx) => {
        const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
        // console.log("Applying migration", migration);
        // split statements for better-sqlite3 compatibility
        await Promise.all(
          migrationSql.split("--> statement-breakpoint").map((s: string) => tx.run(sql.raw(s))),
        );
        // record migration in migrations table
        await tx.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
