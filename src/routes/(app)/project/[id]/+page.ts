import { eq } from "drizzle-orm";
import { projectTable, register, serviceTable, useDb } from "@/database";
import { error } from "@sveltejs/kit";
import { loadServices } from "./$data";

export async function load({ params, depends }) {
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
  if (!project) {
    return error(404, "Project not found");
  }
  register(projectTable, project, depends);

  const services = await loadServices();
  register(serviceTable, services, depends);

  depends("view:project");

  return { project, services };
}
