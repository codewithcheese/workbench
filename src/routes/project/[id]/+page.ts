import { eq } from "drizzle-orm";
import { projectTable } from "@/database/schema";
import { type View } from "@/lib/types.js";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const { driz } = await import("@/database/client");
  const project = await driz.query.projectTable.findFirst({
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
  if (!project) {
    return error(404, "Project not found");
  }
  return { project };
}
