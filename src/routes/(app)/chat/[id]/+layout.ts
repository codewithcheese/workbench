import { eq } from "drizzle-orm";
import {
  chatTable,
  registerModel,
  type Revision,
  type Message,
  revisionTable,
  serviceTable,
  useDb,
} from "@/database";
import { error } from "@sveltejs/kit";
import { createRevision, getLatestRevision, getRevision, loadServices, type Tab } from "./$data";
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

  const services = await loadServices();
  registerModel(serviceTable, services, depends);

  const version = url.searchParams.get("version");
  let revision: Revision & { messages: Message[] };
  if (version) {
    const result = await getRevision(params.id, parseInt(version));
    if (!result) {
      return error(404, `Revision ${version} not found`);
    }
    revision = result;
  } else {
    const result = (await getLatestRevision(params.id)) || (await createRevision(params.id));
    if (!result) {
      return error(500, "Error loading chat revision");
    }
    revision = result;
  }
  registerModel(revisionTable, revision, depends);
  depends("view:messages");
  depends("view:chat");
  return { chat, services, tab, revision, version };
}
