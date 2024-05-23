import { eq } from "drizzle-orm";
import { documentTable } from "@/database/schema";
import { error } from "@sveltejs/kit";
import { useDb } from "@/database/client";

export async function load({ params }) {
  const document = await useDb().query.documentTable.findFirst({
    where: eq(documentTable.id, params.id),
  });
  if (!document) {
    return error(404, "Document not found");
  }
  return { document };
}
