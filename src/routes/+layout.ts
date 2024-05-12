import "../app.css";
import "@fontsource-variable/inter";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({}) => {
  try {
    const { runMigrations } = await import("@/database/migrator");
    console.log("Migrating database");
    await runMigrations();
    console.log("Migration complete");
  } catch (err) {
    console.error(err);
  }
  return {};
};
