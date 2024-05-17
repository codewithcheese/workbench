import "../../app.css";
import "@fontsource-variable/inter";
import { projectTable, register, useDb } from "@/database";
import { sql } from "drizzle-orm/sql";

export const ssr = false;
let migrated = false;

async function exposeDrizzle() {
  const db = useDb();
  // @ts-expect-error
  window.db = db;
  // @ts-expect-error
  window.sql = sql;
  // @ts-expect-error
  window.db_destroy = async function () {
    const rows = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table';`);
    console.log("Dropping all tables", rows);
    for (const record of rows) {
      // drop table
      // @ts-ignore
      await db.run(sql.raw(`DROP TABLE ${record[0]};`));
    }
  };
  // @ts-expect-error
  window.db_listTables = async function () {
    const rows = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table';`);
    console.log("Tables", rows);
    for (const record of rows) {
      // list count of rows
      // @ts-ignore
      const count = await db.get(sql.raw(`SELECT COUNT(*) FROM ${record[0]};`));
      // @ts-ignore
      console.log(record[0], count);
    }
  };
}

export async function load({ depends }) {
  await exposeDrizzle();
  try {
    // only run migrations once
    if (!migrated) {
      const { runMigrations } = await import("@/database/migrator");
      console.log("Migrating database");
      await runMigrations();
      console.log("Migration complete");
      migrated = true;
    }
  } catch (err) {
    console.error(err);
  }
  const projects = await useDb().query.projectTable.findMany({});
  register(projectTable, projects, depends);
  depends("view:projects");
  return {
    projects,
  };
}
