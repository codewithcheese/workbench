import { loadResponses } from "./$data";
import { registerModel, responseTable } from "@/database";

export async function load({ params, depends }) {
  const responses = await loadResponses(params.id);
  registerModel(responseTable, responses, depends);
  depends("view:responses");

  return {
    responses,
  };
}
