import { exposeDb } from "@/database/expose-db";

export async function load({ depends }) {
  try {
    exposeDb();
    const { runMigrations } = await import("@/database/migrator");
    console.log("Migrating database");
    await runMigrations();
    console.log("Migration complete");
  } catch (err) {
    console.error(err);
  }
  return {};
}
