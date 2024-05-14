import { eq } from "drizzle-orm";
import { projectTable } from "@/database/schema";
import { error } from "@sveltejs/kit";
import { useDb } from "@/database/client";

export async function load({ params }) {
  console.log("/project", params.id);
  console.time("/project/[id]");
  const project = await useDb().query.projectTable.findFirst({
    where: eq(projectTable.id, params.id),
    with: {
      responses: {
        with: {
          messages: true,
          model: {
            with: {
              service: true,
            },
          },
        },
      },
    },
  });
  console.timeEnd("/project/[id]");
  if (!project) {
    return error(404, "Project not found");
  }
  return { project };
}
