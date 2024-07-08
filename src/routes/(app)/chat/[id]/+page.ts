import { createRevision, getLatestRevision } from "./$data";
import { registerModel, revisionTable } from "@/database";
import { error } from "@sveltejs/kit";

export async function load({ params, depends }) {
  const revision = (await getLatestRevision(params.id)) || (await createRevision(params.id));
  if (!revision) {
    return error(500, "Error loading chat");
  }
  registerModel(revisionTable, revision, depends);
  depends("view:messages");
  return { revision };
}
