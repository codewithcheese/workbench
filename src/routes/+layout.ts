import "../app.css";
import "@fontsource-variable/inter";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({}) => {
  const { migrate } = await import("@/database/migrator");
  const { kysely } = await import("@/database/client");
  try {
    console.log("Migrating database");
    await migrate(kysely);
    console.log("Migration complete");
  } catch (err) {
    console.error(err);
  }
  return {};
};
