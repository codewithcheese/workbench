import { createResponse, getLatestResponse } from "./$data";
import { registerModel, responseTable } from "@/database";
import { error } from "@sveltejs/kit";

export async function load({ params, depends }) {
  const response = (await getLatestResponse(params.id)) || (await createResponse(params.id));
  if (!response) {
    return error(500, "Error loading chat");
  }
  registerModel(responseTable, response!, depends);
  depends("view:messages");
  return { response };
}
