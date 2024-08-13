import { sql } from "drizzle-orm/sql";
import journal from "./migrations/meta/_journal.json";
import { useDb } from "@/database/client";
import { seed } from "@/database/seed";
import type { PgliteDatabase } from "drizzle-orm/pglite";

export async function runMigrations(skipSeed = false) {
  const db = useDb();
  const result = await db.execute<{ exists: boolean }>(
    sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'migrations'
    );`,
  );

  const haveMigrationsTable = result.rows[0]?.exists ?? false;

  let shouldSeed = false;
  if (!haveMigrationsTable) {
    await db.execute(sql`CREATE TABLE migrations (name text PRIMARY KEY NOT NULL);`);
  }

  for (const entry of journal.entries) {
    await applyMigration(db, entry.idx, entry.tag);
  }

  // if (shouldSeed && !skipSeed) {
  //   await seed();
  // }
  // console.log("Migrations applied");
}

async function applyMigration(db: PgliteDatabase<any>, idx: number, tag: string) {
  // check if tag is already applied
  const result = await db.execute<{ name: string }>(
    sql`SELECT name FROM migrations WHERE name = ${tag}`,
  );

  if (result.rows.length === 0) {
    try {
      await db.transaction(async (tx) => {
        const migrationSql = (await import(`./migrations/${tag}.sql?raw`)).default;
        // Split the tag SQL into individual statements
        const statements = migrationSql
          .split("--> statement-breakpoint")
          .filter((statement: any) => statement.trim() !== "");

        for (const statement of statements) {
          await tx.execute(sql.raw(statement));
        }

        await tx.execute(sql`INSERT INTO migrations (name) VALUES (${tag})`);

        const num = tag.split("_")[0];
        if (num in seed) {
          // @ts-expect-error
          await seed[num](tx);
        }
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
