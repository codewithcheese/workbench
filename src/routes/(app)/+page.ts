import { redirect } from "@sveltejs/kit";

export async function load({ parent }) {
  const data = await parent();
  const chat = data.chats[data.chats.length - 1];
  redirect(301, `/project/${chat.id}/revise`);
}
