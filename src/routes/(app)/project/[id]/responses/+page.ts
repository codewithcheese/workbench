import { registerModel, responseTable, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { loadResponses } from "./$data";

export async function load({ params, depends }) {
  const responses = await loadResponses(params.id);
  registerModel(responseTable, responses, depends);
  depends("view:responses");
  return {
    responses,
  };
}
