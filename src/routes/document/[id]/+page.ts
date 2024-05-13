import { eq } from "drizzle-orm";
import { documentTable } from "@/database/schema";
import type { View } from "$lib/types";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const { driz } = await import("@/database/client");
  const document = await driz.query.documentTable.findFirst({
    where: eq(documentTable.id, params.id),
  });
  if (!document) {
    return error(404, "Document not found");
  }
  return { document };
}
