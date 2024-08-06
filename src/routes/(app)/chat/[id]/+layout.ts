import { eq } from "drizzle-orm";
import { chatTable, keyTable, registerModel, revisionTable, useDb } from "@/database";
import { error } from "@sveltejs/kit";
import { getKeys, getRevision, type Tab } from "./$data";
import { match } from "$lib/route";

export async function load({ route, url, params, depends }) {
  // evaluate tab using route id
  let tab: Tab;
  if (match(`/chat/[id]/eval`, route.id)) {
    console.log("tab is eval", route.id);
    tab = "eval";
  } else if (match(`/chat/[id]/revise`, route.id)) {
    console.log("tab is revise", route.id);
    tab = "revise";
  } else {
    console.log("tab is chat", route.id);
    tab = "chat";
  }

  const chat = await useDb().query.chatTable.findFirst({
    where: eq(chatTable.id, params.id),
    with: {
      revisions: true,
    },
  });
  if (!chat) {
    return error(404, `Chat ${params.id} not found`);
  }
  registerModel(chatTable, chat, depends);

  const keys = await getKeys();
  registerModel(keyTable, keys, depends);

  const version = Number(url.searchParams.get("version")) || null;
  const revision = await getRevision(params.id, version);
  if (!revision) {
    return error(404, `Revision ${version} not found`);
  }
  registerModel(revisionTable, revision, depends);
  depends("view:messages");
  depends("view:chat");
  return { chat, keys, tab, revision, version };
}
