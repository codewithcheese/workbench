import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

let db: PgliteDatabase<typeof schema> | undefined = undefined;

export function useDb(): PgliteDatabase<typeof schema> {
  if (!db) {
    const client = new PGlite("idb://workbench-data");
    db = drizzle(client, { schema });
  }
  return db;
}

// export function useDbFile() {
//   const { getDatabaseFile, overwriteDatabaseFile } = new SQLocalDrizzle(SQLITE_FILENAME);
//   return { getDatabaseFile, overwriteDatabaseFile };
// }
