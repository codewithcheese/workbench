import { useDb } from "@/database/client";

export async function load() {
  return {
    documents: await useDb().query.documentTable.findMany(),
  };
}
