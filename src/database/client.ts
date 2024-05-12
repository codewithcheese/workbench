import { SQLocalDrizzle } from "sqlocal/drizzle";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { sql } from "drizzle-orm/sql";

export const SQLITE_FILENAME = "workbench.db";

const { driver, batchDriver, getDatabaseFile, overwriteDatabaseFile } = new SQLocalDrizzle(
  SQLITE_FILENAME,
);
export const driz = drizzle(driver, batchDriver, { schema });

export { getDatabaseFile, overwriteDatabaseFile, sql };
