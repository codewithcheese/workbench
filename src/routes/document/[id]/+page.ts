import { eq } from "drizzle-orm";
import { documents } from "@/database/schema";
import type { View } from "$lib/types";

async function documentView(id: string) {
  const { driz } = await import("@/database/client");
  return driz.query.documents.findFirst({
    where: eq(documents.id, id),
  });
}

export type DocumentView = View<typeof documentView>;

export async function load({ params }) {
  const document = await documentView(params.id);
  return { document };
}
