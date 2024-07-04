import { eq } from "drizzle-orm";
import { chatTable, registerModel, serviceTable, useDb } from "@/database";
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

  const chat = await useDb().query.chatTable.findFirst({
    where: eq(chatTable.id, params.id),
  });
  if (!chat) {
    return error(404, `Chat ${params.id} not found`);
  }
  registerModel(chatTable, chat, depends);

  const services = await loadServices();
  registerModel(serviceTable, services, depends);

  depends("view:chat");

  return { chat, services, tab };
}
