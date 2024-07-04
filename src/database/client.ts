import { SQLocalDrizzle } from "sqlocal/drizzle";
import { drizzle, SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export const SQLITE_FILENAME = "workbench.db";

let db: SqliteRemoteDatabase<typeof schema> | undefined = undefined;

export function useDb(): BaseSQLiteDatabase<any, any, typeof schema> {
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
