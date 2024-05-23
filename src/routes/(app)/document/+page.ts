import { useDb } from "@/database/client";
import { documentTable, registerModel } from "@/database";

export async function load({ depends }) {
  console.time("/document");
  const documents = await useDb().query.documentTable.findMany();
  console.timeEnd("/document");
  registerModel(documentTable, documents, depends);
  return {
    documents,
  };
}
