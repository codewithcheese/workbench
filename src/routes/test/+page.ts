import { useDb } from "@/database/client";
import { useCache } from "@/database/cache.svelte";
import { projectTable } from "@/database/schema";
import { error } from "@sveltejs/kit";
import { greeting } from "@/routes/test/greeting.svelte";

export const ssr = false;

export async function load({ route, url }) {
  const project = await useDb().query.projectTable.findFirst({
    with: {
      responses: true,
    },
  });
  if (!project) {
    return error(404, "Project not found");
  }

  return {
    message: "Hello Tom",
    project: useCache(project, projectTable, route, url),
    greeting,
  };
}
