import { SQLocalDrizzle } from "sqlocal/drizzle";
import { drizzle, SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

export const SQLITE_FILENAME = "workbench.db";

let db: SqliteRemoteDatabase<typeof schema> | undefined = undefined;

export function useDb() {
  if (!db) {
    const { driver, batchDriver } = new SQLocalDrizzle(SQLITE_FILENAME);
    db = drizzle(driver, batchDriver, { schema });
  }
  return db;
}

export function useDbFile() {
  const { getDatabaseFile, overwriteDatabaseFile } = new SQLocalDrizzle(SQLITE_FILENAME);
  return { getDatabaseFile, overwriteDatabaseFile };
}
