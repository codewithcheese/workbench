import { useDb } from "@/database/client";
import { type Model, projectTable, type Service } from "@/database/schema";
import { eq } from "drizzle-orm";

type DependsFn = (...deps: `${string}:${string}`[]) => void;

export async function loadProjectView(id: string, route: { id: string }, depends: DependsFn) {
  const project = await useDb().query.projectTable.findFirst({
    where: eq(projectTable.id, id),
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
    throw new Error("Project not found");
  }
  return project;
}
