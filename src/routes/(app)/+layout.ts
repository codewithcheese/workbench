import "../../app.css";
import "@fontsource-variable/inter";
import { exposeDb, projectTable, registerModel, useDb } from "@/database";
import { sql } from "drizzle-orm/sql";

export const ssr = false;
let migrated = false;

export async function load({ depends }) {
  exposeDb();
  try {
    // only run migrations once
    if (!migrated) {
      const { runMigrations } = await import("@/database/migrator");
      console.log("Migrating database");
      await runMigrations();
      await useDb().run(sql.raw("PRAGMA foreign_keys=on;"));
      console.log("Migration complete");
      migrated = true;
    }
  } catch (err) {
    console.error(err);
  }
  const projects = await useDb().query.projectTable.findMany({});
  registerModel(projectTable, projects, depends);
  depends("view:projects");
  return {
    projects,
  };
}
