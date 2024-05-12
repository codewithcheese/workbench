import { eq } from "drizzle-orm";
import { projects } from "@/database/schema";
import { type View } from "@/lib/types.js";

async function projectView(id: string) {
  const { driz } = await import("@/database/client");
  return driz.query.projects.findFirst({
    where: eq(projects.id, id),
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
}

export type ProjectView = View<typeof projectView>;

export async function load({ params }) {
  const { driz, sql } = await import("@/database/client");
  // @ts-expect-error
  window.driz = driz;
  // @ts-expect-error
  window.sql = sql;
  const project = await projectView(params.id);
  return { project };
}
