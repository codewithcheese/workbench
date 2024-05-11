import type { Migration } from "kysely";
import { migration00 } from "@/database/migrations/00";

export const migrations: Record<string, Migration> = {
  "00": migration00,
};
