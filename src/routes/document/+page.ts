import { useDb } from "@/database/client";

export async function load() {
  console.time("/document");
  const documents = await useDb().query.documentTable.findMany();
  console.timeEnd("/document");
  return {
    documents,
  };
}
