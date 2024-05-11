import { SQLocalKysely } from "sqlocal/kysely";
import { Kysely } from "kysely";
import type { Database } from "@/database/schema";

export const SQLITE_FILENAME = "database.sqlite3";

const { dialect } = new SQLocalKysely(SQLITE_FILENAME);
export const kysely = new Kysely<Database>({ dialect });
