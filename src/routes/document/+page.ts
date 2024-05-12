import type { View } from "$lib/types";

async function documentsView() {
  const { driz } = await import("@/database/client");
  return driz.query.documents.findMany();
}

export type DocumentsView = View<typeof documentsView>;

export async function load() {
  return {
    documents: await documentsView(),
  };
}
