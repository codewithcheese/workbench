import { eq } from "drizzle-orm";
import { projectTable, registerModel, serviceTable, useDb } from "@/database";
import { error } from "@sveltejs/kit";
import { loadServices } from "./$data";

export async function load({ route, url, params, depends }) {
  // evaluate tab using route id
  let tab;
  if (route.id.includes(`[id]/eval`)) {
    tab = "eval";
    // } else if (route.id.includes(`[id]/eval`)) {
    //   tab = "chat";
  } else if (route.id.includes(`[id]/revise`)) {
    tab = "revise";
  }

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

  return { project, services, tab };
}
