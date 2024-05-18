import { registerModel, responseTable } from "@/database";
import { loadResponses } from "./$data";

export async function load({ params, depends }) {
  console.log("responses load", params);
  const responses = await loadResponses(params.id);
  registerModel(responseTable, responses, depends);
  depends("view:responses");
  return {
    responses,
  };
}
