import "../../app.css";
import "@fontsource-variable/inter";
import { exposeDb, chatTable, registerModel, useDb } from "@/database";
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
  const chats = await useDb().query.chatTable.findMany({});
  registerModel(chatTable, chats, depends);
  depends("view:chats");
  return {
    chats,
  };
}
