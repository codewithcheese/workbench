import { getLatestResponse } from "./$data";
import { registerModel, responseTable } from "@/database";
import { error } from "@sveltejs/kit";

export async function load({ params, depends }) {
  try {
    const { response } = await getLatestResponse(params.id);
    registerModel(responseTable, response, depends);
    depends("view:messages");
    console.log("response", response);
    return { response, hello: "world" };
  } catch (e) {
    console.error("error", e);
    return error(500, "Error loading chat");
  }
}
