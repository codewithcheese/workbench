import { eq } from "drizzle-orm";
import { projectTable, registerModel, serviceTable, useDb } from "@/database";
import { error } from "@sveltejs/kit";
import { loadServices } from "./$data";

export async function load({ params, depends }) {
  const project = await useDb().query.projectTable.findFirst({
    where: eq(projectTable.id, params.id),
  });
  if (!project) {
    return error(404, "Project not found");
  }
  registerModel(projectTable, project, depends);

  const services = await loadServices();
  registerModel(serviceTable, services, depends);

  depends("view:project");

  return { project, services };
}
