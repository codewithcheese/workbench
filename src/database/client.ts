import { SQLocalKysely } from "sqlocal/kysely";
import { Kysely } from "kysely";
import type { Database } from "@/database/schema";
import { migrate } from "@/database/migrator";

export const SQLITE_FILENAME = "workbench.db";

const sqlocal = new SQLocalKysely(SQLITE_FILENAME);
const kysely = new Kysely<Database>({ dialect: sqlocal.dialect });

try {
  console.log("Migrating database");
  await migrate(kysely);
  console.log("Migration complete");
} catch (err) {
  console.error(err);
}

export { kysely };
export const { getDatabaseFile, overwriteDatabaseFile } = sqlocal;
