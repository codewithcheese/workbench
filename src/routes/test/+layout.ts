import { useCache } from "@/database/cache.svelte";
import { useDb } from "@/database/client";
import { projectTable } from "@/database/schema";

export async function load({ route, url }) {
  return {
    project: useCache((await useDb().query.projectTable.findFirst())!, projectTable, route, url),
  };
}
