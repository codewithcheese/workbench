import "../app.css";
import "@fontsource-variable/inter";
import { browser } from "$app/environment";

export const ssr = false;

if (browser) {
  // migrate database
  (async () => {
    console.log("Migrating database");
    const { migrator } = await import("@/database/migrator");
    const results = await migrator.migrateToLatest();
    console.log("Migration results", results);
  })();
}
