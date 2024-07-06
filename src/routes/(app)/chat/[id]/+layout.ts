import { eq } from "drizzle-orm";
import { chatTable, registerModel, responseTable, serviceTable, useDb } from "@/database";
import { error } from "@sveltejs/kit";
import { createResponse, getLatestResponse, loadServices } from "./$data";

export async function load({ route, url, params, depends }) {
  // evaluate tab using route id
  let tab;
  if (route.id.includes(`[id]/eval`)) {
    tab = "eval";
    // } else if (route.id.includes(`[id]/eval`)) {
    //   tab = "chat";
  } else if (route.id.includes(`[id]/revise`)) {
    tab = "revise";
  } else {
    tab = "chat";
  }

  const chat = await useDb().query.chatTable.findFirst({
    where: eq(chatTable.id, params.id),
  });
  if (!chat) {
    return error(404, `Chat ${params.id} not found`);
  }
  registerModel(chatTable, chat, depends);

  const services = await loadServices();
  registerModel(serviceTable, services, depends);

  const response = (await getLatestResponse(params.id)) || (await createResponse(params.id));
  if (!response) {
    return error(500, "Error loading chat");
  }
  registerModel(responseTable, response!, depends);
  depends("view:messages");

  depends("view:chat");

  return { chat, services, tab, response };
}
