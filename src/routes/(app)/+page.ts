import { redirect } from "@sveltejs/kit";

export async function load({ parent }) {
  const data = await parent();
  const project = data.projects[data.projects.length - 1];
  redirect(301, `/project/${project.id}/revise`);
}
