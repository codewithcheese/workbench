import { SQLocalKysely } from "sqlocal/kysely";
import { Kysely } from "kysely";
import type { Database } from "@/database/schema";
import { migrate } from "@/database/migrator";

export const SQLITE_FILENAME = "workbench.db";

const sqlocal = new SQLocalKysely(SQLITE_FILENAME);
const kysely = new Kysely<Database>({ dialect: sqlocal.dialect });

export { kysely };
export const { getDatabaseFile, overwriteDatabaseFile } = sqlocal;
