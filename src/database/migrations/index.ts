import type { Migration } from "kysely";
import * as migration0 from "./0";

export const migrations: Record<string, Migration> = {
  migration0: migration0,
};
