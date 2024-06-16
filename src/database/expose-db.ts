import { useDb } from "@/database/client";
import { sql } from "drizzle-orm/sql";
import { exportDb } from "@/database/export-db";

export function exposeDb() {
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
  // @ts-expect-error
  window.db_download = exportDb;
}
